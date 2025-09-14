import express from "express";
import { dbStorage } from "../db.js";
import * as schema from "../../shared/schema.js";
import { eq, desc, and, or, like, count, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

// Get database instance for direct queries
const db = dbStorage.db;

const router = express.Router();

// Middleware للتحقق من صلاحيات المدير
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "غير مصرح" });
    }

    const token = authHeader.split(' ')[1];
    const session = await dbStorage.getAdminSession(token);

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "جلسة منتهية الصلاحية" });
    }

    const admin = await dbStorage.getAdminByEmail(session.adminId!);

    if (!admin || admin.userType !== 'admin') {
      return res.status(403).json({ error: "صلاحيات غير كافية" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("خطأ في التحقق من صلاحيات المدير:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
};

// تسجيل دخول المدير
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // البحث بالإيميل أو اسم المستخدم
    const admin = await dbStorage.getAdminByEmail(email);

    if (!admin) {
      return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    // مقارنة كلمة المرور بإستخدام bcrypt
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    if (!admin.isActive) {
      return res.status(401).json({ error: "الحساب غير نشط" });
    }

    // إنشاء جلسة جديدة
    const token = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة

    await dbStorage.createAdminSession({
      adminId: admin.id,
      token,
      userType: "admin",
      expiresAt
    });

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        userType: admin.userType
      }
    });
  } catch (error) {
    console.error("خطأ في تسجيل دخول المدير:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// تسجيل خروج المدير
router.post("/logout", requireAdmin, async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];

    await dbStorage.deleteAdminSession(token);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// لوحة المعلومات
router.get("/dashboard", requireAdmin, async (req, res) => {
  try {
    // إحصائيات عامة
    const [
      totalRestaurants,
      totalOrders,
      totalDrivers,
      totalCustomers,
      todayOrders,
      pendingOrders,
      activeDrivers
    ] = await Promise.all([
      db.select({ count: count() }).from(schema.restaurants),
      db.select({ count: count() }).from(schema.orders),
      db.select({ count: count() }).from(schema.adminUsers).where(eq(schema.adminUsers.userType, "driver")),
      db.select({ count: count() }).from(schema.customers),
      db.select({ count: count() }).from(schema.orders)
        .where(sql`DATE(created_at) = CURRENT_DATE`),
      db.select({ count: count() }).from(schema.orders)
        .where(eq(schema.orders.status, "pending")),
      db.select({ count: count() }).from(schema.adminUsers)
        .where(and(
          eq(schema.adminUsers.userType, "driver"),
          eq(schema.adminUsers.isActive, true)
        ))
    ]);

    // إحصائيات مالية
    const [totalRevenue, todayRevenue] = await Promise.all([
      db.select({ 
        total: sql<number>`COALESCE(SUM(${schema.orders.total}), 0)` 
      }).from(schema.orders)
        .where(eq(schema.orders.status, "delivered")),
      db.select({ 
        total: sql<number>`COALESCE(SUM(${schema.orders.total}), 0)` 
      }).from(schema.orders)
        .where(and(
          eq(schema.orders.status, "delivered"),
          sql`DATE(created_at) = CURRENT_DATE`
        ))
    ]);

    // الطلبات الأخيرة
    const recentOrders = await db.select()
      .from(schema.orders)
      .limit(10)
      .orderBy(desc(schema.orders.createdAt));

    res.json({
      stats: {
        totalRestaurants: totalRestaurants[0].count,
        totalOrders: totalOrders[0].count,
        totalDrivers: totalDrivers[0].count,
        totalCustomers: totalCustomers[0].count,
        todayOrders: todayOrders[0].count,
        pendingOrders: pendingOrders[0].count,
        activeDrivers: activeDrivers[0].count,
        totalRevenue: totalRevenue[0].total,
        todayRevenue: todayRevenue[0].total
      },
      recentOrders
    });
  } catch (error) {
    console.error("خطأ في لوحة المعلومات:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إدارة التصنيفات
router.get("/categories", requireAdmin, async (req, res) => {
  try {
    const categories = await db.select()
      .from(schema.categories)
      .orderBy(schema.categories.sortOrder, schema.categories.name);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/categories", requireAdmin, async (req, res) => {
  try {
    const categoryData = req.body;
    const [newCategory] = await db.insert(schema.categories)
      .values(categoryData)
      .returning();
    
    res.json(newCategory);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.put("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const [updatedCategory] = await db.update(schema.categories)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(schema.categories.id, id))
      .returning();
    
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.delete(schema.categories)
      .where(eq(schema.categories.id, id));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إدارة أقسام المطاعم
router.get("/restaurant-sections", requireAdmin, async (req, res) => {
  try {
    const sections = await db.select()
      .from(schema.restaurantSections)
      .orderBy(schema.restaurantSections.sortOrder, schema.restaurantSections.name);
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/restaurant-sections", requireAdmin, async (req, res) => {
  try {
    const sectionData = req.body;
    const [newSection] = await db.insert(schema.restaurantSections)
      .values(sectionData)
      .returning();
    
    res.json(newSection);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إدارة المطاعم
router.get("/restaurants", requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, categoryId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          like(schema.restaurants.name, `%${search}%`),
          like(schema.restaurants.description, `%${search}%`)
        )
      );
    }
    
    if (categoryId) {
      whereConditions.push(eq(schema.restaurants.categoryId, categoryId as string));
    }

    const restaurants = await db.select()
      .from(schema.restaurants)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .limit(Number(limit))
      .offset(offset)
      .orderBy(desc(schema.restaurants.createdAt));

    const [totalCount] = await db.select({ count: count() })
      .from(schema.restaurants)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    res.json(restaurants);
  } catch (error) {
    console.error("خطأ في جلب المطاعم:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/restaurants", requireAdmin, async (req, res) => {
  try {
    const restaurantData = req.body;
    
    // إضافة صورة افتراضية إذا لم تكن موجودة
    if (!restaurantData.image) {
      restaurantData.image = "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg";
    }
    
    const [newRestaurant] = await db.insert(schema.restaurants)
      .values(restaurantData)
      .returning();
    
    res.json(newRestaurant);
  } catch (error) {
    console.error("خطأ في إضافة المطعم:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.put("/restaurants/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const [updatedRestaurant] = await db.update(schema.restaurants)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(schema.restaurants.id, id))
      .returning();
    
    res.json(updatedRestaurant);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/restaurants/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.delete(schema.restaurants)
      .where(eq(schema.restaurants.id, id));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إدارة عناصر القائمة
router.get("/restaurants/:restaurantId/menu", requireAdmin, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const menuItems = await db.select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.restaurantId, restaurantId))
      .orderBy(schema.menuItems.name);
    
    res.json(menuItems);
  } catch (error) {
    console.error("خطأ في جلب عناصر القائمة:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/menu-items", requireAdmin, async (req, res) => {
  try {
    const menuItemData = req.body;
    
    // إضافة صورة افتراضية إذا لم تكن موجودة
    if (!menuItemData.image) {
      menuItemData.image = "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg";
    }
    
    const [newMenuItem] = await db.insert(schema.menuItems)
      .values(menuItemData)
      .returning();
    
    res.json(newMenuItem);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.put("/menu-items/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const [updatedMenuItem] = await db.update(schema.menuItems)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(schema.menuItems.id, id))
      .returning();
    
    res.json(updatedMenuItem);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/menu-items/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.delete(schema.menuItems)
      .where(eq(schema.menuItems.id, id));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إدارة الطلبات
router.get("/orders", requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereConditions = [];
    
    if (status && status !== 'all') {
      whereConditions.push(eq(schema.orders.status, status as string));
    }
    
    if (search) {
      whereConditions.push(
        or(
          like(schema.orders.orderNumber, `%${search}%`),
          like(schema.orders.customerName, `%${search}%`),
          like(schema.orders.customerPhone, `%${search}%`)
        )
      );
    }

    const orders = await db.select()
      .from(schema.orders)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .limit(Number(limit))
      .offset(offset)
      .orderBy(desc(schema.orders.createdAt));

    const [totalCount] = await db.select({ count: count() })
      .from(schema.orders)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.put("/orders/:id/status", requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status, driverId } = req.body;
    
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (driverId) {
      updateData.driverId = driverId;
    }
    
    const [updatedOrder] = await db.update(schema.orders)
      .set(updateData)
      .where(eq(schema.orders.id, id))
      .returning();
    
    // إضافة تتبع للطلب
    await db.insert(schema.orderTracking).values({
      orderId: id,
      status,
      message: `تم تحديث حالة الطلب إلى: ${status}`,
      createdBy: req.admin.id,
      createdByType: 'admin'
    });
    
    res.json(updatedOrder);
  } catch (error) {
    console.error("خطأ في تحديث حالة الطلب:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إدارة السائقين
router.get("/drivers", requireAdmin, async (req, res) => {
  try {
    const drivers = await db.select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.userType, "driver"))
      .orderBy(desc(schema.adminUsers.createdAt));
    
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/drivers", requireAdmin, async (req, res) => {
  try {
    const driverData = {
      ...req.body,
      userType: "driver"
    };
    
    const [newDriver] = await db.insert(schema.adminUsers)
      .values(driverData)
      .returning();
    
    res.json(newDriver);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.put("/drivers/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const [updatedDriver] = await db.update(schema.adminUsers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(schema.adminUsers.id, id))
      .returning();
    
    res.json(updatedDriver);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/drivers/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.delete(schema.adminUsers)
      .where(eq(schema.adminUsers.id, id));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إحصائيات السائق
router.get("/drivers/:id/stats", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    let dateFilter = [];
    if (startDate) {
      dateFilter.push(sql`${schema.orders.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      dateFilter.push(sql`${schema.orders.createdAt} <= ${endDate}`);
    }
    
    const whereConditions = [
      eq(schema.orders.driverId, id),
      ...dateFilter
    ];
    
    const [stats] = await db.select({
      totalOrders: count(),
      totalEarnings: sql<number>`COALESCE(SUM(${schema.orders.driverEarnings}), 0)`,
      completedOrders: sql<number>`COUNT(CASE WHEN ${schema.orders.status} = 'delivered' THEN 1 END)`,
      cancelledOrders: sql<number>`COUNT(CASE WHEN ${schema.orders.status} = 'cancelled' THEN 1 END)`
    }).from(schema.orders)
      .where(and(...whereConditions));
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إدارة العروض الخاصة
router.get("/special-offers", requireAdmin, async (req, res) => {
  try {
    const offers = await db.select()
      .from(schema.specialOffers)
      .orderBy(desc(schema.specialOffers.createdAt));
    
    res.json(offers);
  } catch (error) {
    console.error("خطأ في جلب العروض الخاصة:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/special-offers", requireAdmin, async (req, res) => {
  try {
    const offerData = req.body;
    
    const [newOffer] = await db.insert(schema.specialOffers)
      .values(offerData)
      .returning();
    
    res.json(newOffer);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.put("/special-offers/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const [updatedOffer] = await db.update(schema.specialOffers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(schema.specialOffers.id, id))
      .returning();
    
    res.json(updatedOffer);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/special-offers/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.delete(schema.specialOffers)
      .where(eq(schema.specialOffers.id, id));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إدارة الإشعارات
router.post("/notifications", requireAdmin, async (req: any, res) => {
  try {
    const notificationData = {
      ...req.body,
      createdBy: req.admin.id
    };
    
    const [newNotification] = await db.insert(schema.notifications)
      .values(notificationData)
      .returning();
    
    res.json(newNotification);
  } catch (error) {
    console.error("خطأ في إنشاء الإشعار:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إعدادات النظام
router.get("/settings", requireAdmin, async (req, res) => {
  try {
    const settings = await db.select()
      .from(schema.systemSettings)
      .orderBy(schema.systemSettings.category, schema.systemSettings.key);
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.put("/settings/:key", requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const [updatedSetting] = await db.update(schema.systemSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(schema.systemSettings.key, key))
      .returning();
    
    res.json(updatedSetting);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إعدادات واجهة المستخدم (متاحة للعامة)
router.get("/ui-settings", async (req, res) => {
  try {
    // TEMPORARY FIX: Return sample UI settings
    console.log('TEMPORARY FIX: Returning sample UI settings from admin.ts');
    const settings = [
      { id: '1', key: 'app_name', value: 'تطبيق السريع ون', category: 'general', isActive: true },
      { id: '2', key: 'delivery_fee', value: '5.00', category: 'pricing', isActive: true },
      { id: '3', key: 'minimum_order', value: '20.00', category: 'pricing', isActive: true }
    ];
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// تحديث أوقات العمل
router.put("/business-hours", requireAdmin, async (req, res) => {
  try {
    const { opening_time, closing_time, store_status } = req.body;
    
    const updates = [];
    
    if (opening_time) {
      updates.push(
        db.update(schema.systemSettings)
          .set({ value: opening_time, updatedAt: new Date() })
          .where(eq(schema.systemSettings.key, 'opening_time'))
      );
    }
    
    if (closing_time) {
      updates.push(
        db.update(schema.systemSettings)
          .set({ value: closing_time, updatedAt: new Date() })
          .where(eq(schema.systemSettings.key, 'closing_time'))
      );
    }
    
    if (store_status) {
      updates.push(
        db.update(schema.systemSettings)
          .set({ value: store_status, updatedAt: new Date() })
          .where(eq(schema.systemSettings.key, 'store_status'))
      );
    }
    
    await Promise.all(updates);
    
    res.json({ success: true, message: "تم تحديث أوقات العمل بنجاح" });
  } catch (error) {
    console.error("خطأ في تحديث أوقات العمل:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إدارة المستخدمين الموحدة (عملاء، سائقين، مديرين)
router.get("/users", requireAdmin, async (req, res) => {
  try {
    // جلب العملاء
    const customers = await db.select({
      id: schema.customers.id,
      name: schema.customers.name,
      email: schema.customers.email,
      phone: schema.customers.phone,
      role: sql<string>`'customer'`,
      isActive: schema.customers.isActive,
      createdAt: schema.customers.createdAt,
      address: sql<string>`NULL`
    }).from(schema.customers);

    // جلب السائقين والمديرين من adminUsers
    const adminUsers = await db.select({
      id: schema.adminUsers.id,
      name: schema.adminUsers.name,
      email: schema.adminUsers.email,
      phone: schema.adminUsers.phone,
      role: schema.adminUsers.userType,
      isActive: schema.adminUsers.isActive,
      createdAt: schema.adminUsers.createdAt,
      address: sql<string>`NULL`
    }).from(schema.adminUsers);

    // دمج جميع المستخدمين وترتيبهم حسب تاريخ الإنشاء
    const allUsers = [...customers, ...adminUsers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(allUsers);
  } catch (error) {
    console.error("خطأ في جلب المستخدمين:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/users/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, role, isActive } = req.body;
    
    // تحديد الجدول بناءً على الدور الجديد أو الحالي
    let targetTable = 'customers';
    let currentUser = null;
    
    // البحث عن المستخدم في جدول العملاء أولاً
    const customerResult = await db.select()
      .from(schema.customers)
      .where(eq(schema.customers.id, id))
      .limit(1);
    
    if (customerResult.length > 0) {
      currentUser = customerResult[0];
      targetTable = 'customers';
    } else {
      // البحث في جدول المديرين والسائقين
      const adminResult = await db.select()
        .from(schema.adminUsers)
        .where(eq(schema.adminUsers.id, id))
        .limit(1);
      
      if (adminResult.length > 0) {
        currentUser = adminResult[0];
        targetTable = 'adminUsers';
      }
    }

    if (!currentUser) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    // إعداد البيانات للتحديث
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // تحديث كلمة المرور إذا تم توفيرها
    if (password && password.trim()) {
      const bcrypt = await import('bcrypt');
      updateData.password = await bcrypt.hash(password, 10);
    }

    let updatedUser;
    
    // التعامل مع تغيير الدور (من عميل إلى سائق/مدير أو العكس)
    if (role && role !== (currentUser as any).userType && role !== 'customer') {
      // إذا كان المستخدم عميل ونريد جعله سائق/مدير
      if (targetTable === 'customers' && (role === 'driver' || role === 'admin')) {
        // إنشاء مستخدم جديد في جدول adminUsers
        const bcrypt = await import('bcrypt');
        const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('123456', 10);
        
        const [newAdminUser] = await db.insert(schema.adminUsers).values({
          name: name || currentUser.name,
          email: email || currentUser.email,
          phone: phone || currentUser.phone,
          password: hashedPassword,
          userType: role,
          isActive: isActive !== undefined ? isActive : currentUser.isActive
        }).returning();
        
        // حذف المستخدم من جدول العملاء
        await db.delete(schema.customers).where(eq(schema.customers.id, id));
        
        updatedUser = { ...newAdminUser, role: newAdminUser.userType };
      }
      // إذا كان سائق/مدير ونريد جعله عميل
      else if (targetTable === 'adminUsers' && role === 'customer') {
        // إنشاء عميل جديد
        const bcrypt = await import('bcrypt');
        const hashedPassword = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('123456', 10);
        
        const [newCustomer] = await db.insert(schema.customers).values({
          name: name || currentUser.name,
          username: (email || currentUser.email).split('@')[0], // استخدام الجزء الأول من البريد كـ username
          email: email || currentUser.email,
          phone: phone || currentUser.phone,
          password: hashedPassword,
          isActive: isActive !== undefined ? isActive : currentUser.isActive
        }).returning();
        
        // حذف من جدول adminUsers
        await db.delete(schema.adminUsers).where(eq(schema.adminUsers.id, id));
        
        updatedUser = { ...newCustomer, role: 'customer' };
      }
      // تغيير من سائق إلى مدير أو العكس
      else if (targetTable === 'adminUsers') {
        updateData.userType = role;
        
        const [result] = await db.update(schema.adminUsers)
          .set(updateData)
          .where(eq(schema.adminUsers.id, id))
          .returning();
          
        updatedUser = { ...result, role: result.userType };
      }
    } else {
      // تحديث عادي بدون تغيير الدور
      if (targetTable === 'customers') {
        // إزالة userType من updateData للعملاء
        delete updateData.userType;
        
        const [result] = await db.update(schema.customers)
          .set(updateData)
          .where(eq(schema.customers.id, id))
          .returning();
          
        updatedUser = { ...result, role: 'customer' };
      } else {
        // تحديث السائق/المدير
        if (role && (role === 'driver' || role === 'admin')) {
          updateData.userType = role;
        }
        
        const [result] = await db.update(schema.adminUsers)
          .set(updateData)
          .where(eq(schema.adminUsers.id, id))
          .returning();
          
        updatedUser = { ...result, role: result.userType };
      }
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("خطأ في تحديث المستخدم:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // البحث عن المستخدم في جدول العملاء
    const customerResult = await db.select()
      .from(schema.customers)
      .where(eq(schema.customers.id, id))
      .limit(1);
    
    if (customerResult.length > 0) {
      // حذف العميل
      await db.delete(schema.customers).where(eq(schema.customers.id, id));
      res.json({ success: true, message: "تم حذف العميل بنجاح" });
      return;
    }
    
    // البحث في جدول المديرين والسائقين
    const adminResult = await db.select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.id, id))
      .limit(1);
    
    if (adminResult.length > 0) {
      const user = adminResult[0];
      
      // منع حذف المدير الرئيسي
      if (user.userType === 'admin' && user.email === 'admin@alsarie-one.com') {
        return res.status(403).json({ error: "لا يمكن حذف المدير الرئيسي" });
      }
      
      // حذف السائق أو المدير
      await db.delete(schema.adminUsers).where(eq(schema.adminUsers.id, id));
      res.json({ success: true, message: `تم حذف ${user.userType === 'driver' ? 'السائق' : 'المدير'} بنجاح` });
      return;
    }
    
    // المستخدم غير موجود
    res.status(404).json({ error: "المستخدم غير موجود" });
  } catch (error) {
    console.error("خطأ في حذف المستخدم:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export { router as adminRoutes };