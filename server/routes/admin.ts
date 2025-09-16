import express from "express";
import { storage } from "../storage";
import { authService } from "../auth";
import bcrypt from "bcrypt";
import { z } from "zod";
import { eq, and, desc, sql, or, like, asc, inArray } from "drizzle-orm";
import {
  insertRestaurantSchema,
  insertCategorySchema,
  insertSpecialOfferSchema,
  insertAdminUserSchema,
  insertDriverSchema,
  insertMenuItemSchema,
  adminUsers,
  adminSessions,
  categories,
  restaurantSections,
  restaurants,
  menuItems,
  users,
  customers,
  userAddresses,
  orders,
  specialOffers,
  notifications,
  ratings,
  systemSettings,
  drivers,
  orderTracking,
  cart,
  favorites
} from "@shared/schema";
import { DatabaseStorage } from "../db";

const router = express.Router();
const dbStorage = new DatabaseStorage();
const db = dbStorage.db;

// Schema object for direct database operations
const schema = {
  adminUsers,
  adminSessions,
  categories,
  restaurantSections,
  restaurants,
  menuItems,
  users,
  customers,
  userAddresses,
  orders,
  specialOffers,
  notifications,
  ratings,
  systemSettings,
  drivers,
  orderTracking,
  cart,
  favorites
};

// Middleware للتحقق من صلاحيات المدير
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "غير مصرح" });
    }

    const token = authHeader.split(' ')[1];
    const validation = await authService.validateSession(token);

    if (!validation.valid || validation.userType !== 'admin') {
      return res.status(401).json({ error: "جلسة منتهية الصلاحية أو صلاحيات غير كافية" });
    }

    req.admin = { id: validation.adminId, userType: validation.userType };
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
    
    if (!email || !password) {
      return res.status(400).json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" });
    }

    // Use AuthService for login
    const loginResult = await authService.loginAdmin(email, password);
    
    if (loginResult.success) {
      res.json({
        success: true,
        token: loginResult.token,
        userType: loginResult.userType,
        message: "تم تسجيل الدخول بنجاح"
      });
    } else {
      res.status(401).json({ message: loginResult.message });
    }
  } catch (error) {
    console.error("خطأ في تسجيل دخول المدير:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// تسجيل خروج المدير
router.post("/logout", requireAdmin, async (req: any, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (token) {
      // Properly revoke the session for security
      const logoutResult = await authService.logout(token);
      
      if (!logoutResult) {
        console.warn("Failed to revoke session on logout, but proceeding with logout");
      }
    }

    res.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
  } catch (error) {
    console.error("خطأ في تسجيل الخروج:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// لوحة المعلومات
router.get("/dashboard", requireAdmin, async (req, res) => {
  try {
    // جلب البيانات من قاعدة البيانات
    const [restaurants, orders, drivers, users] = await Promise.all([
      storage.getRestaurants(),
      storage.getOrders(),
      storage.getDrivers(),
      storage.getUsers ? storage.getUsers() : []
    ]);

    const today = new Date().toDateString();
    
    // حساب الإحصائيات باستخدام عمليات المصفوفات
    const totalRestaurants = restaurants.length;
    const totalOrders = orders.length;
    const totalDrivers = drivers.length;
    const totalCustomers = users.length; // أو 0 إذا لم تكن متوفرة
    
    const todayOrders = orders.filter(order => 
      order.createdAt.toDateString() === today
    ).length;
    
    const pendingOrders = orders.filter(order => 
      order.status === "pending"
    ).length;
    
    const activeDrivers = drivers.filter(driver => 
      driver.isActive === true
    ).length;

    // حساب الإيرادات
    const deliveredOrders = orders.filter(order => order.status === "delivered");
    const totalRevenue = deliveredOrders.reduce((sum, order) => 
      sum + parseFloat(order.total || "0"), 0
    );
    
    const todayDeliveredOrders = deliveredOrders.filter(order => 
      order.createdAt.toDateString() === today
    );
    const todayRevenue = todayDeliveredOrders.reduce((sum, order) => 
      sum + parseFloat(order.total || "0"), 0
    );

    // الطلبات الأخيرة (أحدث 10 طلبات)
    const recentOrders = orders
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    res.json({
      stats: {
        totalRestaurants,
        totalOrders,
        totalDrivers,
        totalCustomers,
        todayOrders,
        pendingOrders,
        activeDrivers,
        totalRevenue,
        todayRevenue
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
    const categories = await storage.getCategories();
    // ترتيب التصنيفات حسب sortOrder ثم الاسم
    const sortedCategories = categories.sort((a, b) => {
      const aOrder = a.sortOrder ?? 0;
      const bOrder = b.sortOrder ?? 0;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return a.name.localeCompare(b.name);
    });
    res.json(sortedCategories);
  } catch (error) {
    console.error("خطأ في جلب التصنيفات:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/categories", requireAdmin, async (req, res) => {
  try {
    // التحقق من صحة البيانات مع الحقول المطلوبة
    const validatedData = insertCategorySchema.parse({
      ...req.body,
      // التأكد من وجود الحقول المطلوبة
      sortOrder: req.body.sortOrder || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });
    
    const newCategory = await storage.createCategory(validatedData);
    res.status(201).json(newCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "بيانات التصنيف غير صحيحة", 
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    console.error("خطأ في إضافة التصنيف:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.put("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // التحقق من صحة البيانات المحدثة (جزئي)
    const validatedData = insertCategorySchema.partial().parse(req.body);
    
    const updatedCategory = await storage.updateCategory(id, {
      ...validatedData, 
      updatedAt: new Date()
    });
    
    if (!updatedCategory) {
      return res.status(404).json({ error: "التصنيف غير موجود" });
    }
    
    res.json(updatedCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "بيانات تحديث التصنيف غير صحيحة", 
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    console.error("خطأ في تحديث التصنيف:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await storage.deleteCategory(id);
    
    if (!success) {
      return res.status(404).json({ error: "التصنيف غير موجود" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("خطأ في حذف التصنيف:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إدارة المطاعم
router.get("/restaurants", requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, categoryId } = req.query;
    
    // جلب المطاعم باستخدام المرشحات
    const filters: any = {};
    if (categoryId) {
      filters.categoryId = categoryId as string;
    }
    if (search) {
      filters.search = search as string;
    }
    
    const allRestaurants = await storage.getRestaurants(filters);
    
    // ترتيب المطاعم حسب تاريخ الإنشاء (الأحدث أولاً)
    const sortedRestaurants = allRestaurants.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
    
    // تطبيق التصفح (pagination)
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedRestaurants = sortedRestaurants.slice(startIndex, endIndex);

    res.json({
      restaurants: paginatedRestaurants,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: sortedRestaurants.length,
        pages: Math.ceil(sortedRestaurants.length / Number(limit))
      }
    });
  } catch (error) {
    console.error("خطأ في جلب المطاعم:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/restaurants", requireAdmin, async (req, res) => {
  try {
    // التحقق من صحة البيانات مع إضافة الحقول المطلوبة
    const validatedData = insertRestaurantSchema.parse({
      ...req.body,
      // إضافة صورة افتراضية إذا لم تكن موجودة
      image: req.body.image || "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg",
      // إضافة وقت التسليم الافتراضي إذا لم يكن موجود
      deliveryTime: req.body.deliveryTime || "30-45 دقيقة",
      // التأكد من الحقول الافتراضية
      openingTime: req.body.openingTime || "08:00",
      closingTime: req.body.closingTime || "23:00",
      workingDays: req.body.workingDays || "0,1,2,3,4,5,6",
      minimumOrder: req.body.minimumOrder || "0",
      deliveryFee: req.body.deliveryFee || "0",
      isOpen: req.body.isOpen !== undefined ? req.body.isOpen : true,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      isFeatured: req.body.isFeatured !== undefined ? req.body.isFeatured : false,
      isNew: req.body.isNew !== undefined ? req.body.isNew : false,
      isTemporarilyClosed: req.body.isTemporarilyClosed !== undefined ? req.body.isTemporarilyClosed : false
    });
    
    const newRestaurant = await storage.createRestaurant(validatedData);
    res.status(201).json(newRestaurant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "بيانات المطعم غير صحيحة", 
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    console.error("خطأ في إضافة المطعم:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.put("/restaurants/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // التحقق من صحة البيانات المحدثة (جزئي)
    const validatedData = insertRestaurantSchema.partial().parse(req.body);
    
    const updatedRestaurant = await storage.updateRestaurant(id, {
      ...validatedData, 
      updatedAt: new Date()
    });
    
    if (!updatedRestaurant) {
      return res.status(404).json({ error: "المطعم غير موجود" });
    }
    
    res.json(updatedRestaurant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "بيانات تحديث المطعم غير صحيحة", 
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    console.error("خطأ في تحديث المطعم:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/restaurants/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await storage.deleteRestaurant(id);
    
    if (!success) {
      return res.status(404).json({ error: "المطعم غير موجود" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("خطأ في حذف المطعم:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إدارة عناصر القائمة
router.get("/restaurants/:restaurantId/menu", requireAdmin, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const menuItems = await storage.getMenuItems(restaurantId);
    
    // ترتيب العناصر حسب الاسم
    const sortedItems = menuItems.sort((a, b) => a.name.localeCompare(b.name));
    
    res.json(sortedItems);
  } catch (error) {
    console.error("خطأ في جلب عناصر القائمة:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/menu-items", requireAdmin, async (req, res) => {
  try {
    // التحقق من صحة البيانات
    const validatedData = insertMenuItemSchema.parse({
      ...req.body,
      // إضافة صورة افتراضية إذا لم تكن موجودة
      image: req.body.image || "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
    });
    
    const newMenuItem = await storage.createMenuItem(validatedData);
    res.status(201).json(newMenuItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "بيانات عنصر القائمة غير صحيحة", 
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    console.error("خطأ في إضافة عنصر القائمة:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.put("/menu-items/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // التحقق من صحة البيانات المحدثة (جزئي)
    const validatedData = insertMenuItemSchema.partial().parse(req.body);
    
    const updatedMenuItem = await storage.updateMenuItem(id, validatedData);
    
    if (!updatedMenuItem) {
      return res.status(404).json({ error: "عنصر القائمة غير موجود" });
    }
    
    res.json(updatedMenuItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "بيانات تحديث عنصر القائمة غير صحيحة", 
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    console.error("خطأ في تحديث عنصر القائمة:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/menu-items/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await storage.deleteMenuItem(id);
    
    if (!success) {
      return res.status(404).json({ error: "عنصر القائمة غير موجود" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("خطأ في حذف عنصر القائمة:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إدارة الطلبات
router.get("/orders", requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    let allOrders = await storage.getOrders();
    
    // تطبيق مرشحات البحث
    if (status && status !== 'all') {
      allOrders = allOrders.filter(order => order.status === status);
    }
    
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      allOrders = allOrders.filter(order => 
        order.orderNumber?.toLowerCase().includes(searchTerm) ||
        order.customerName?.toLowerCase().includes(searchTerm) ||
        order.customerPhone?.toLowerCase().includes(searchTerm)
      );
    }

    // ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
    const sortedOrders = allOrders.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
    
    // تطبيق التصفح (pagination)
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

    res.json({
      orders: paginatedOrders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: sortedOrders.length,
        pages: Math.ceil(sortedOrders.length / Number(limit))
      }
    });
  } catch (error) {
    console.error("خطأ في جلب الطلبات:", error);
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
    
    const updatedOrder = await storage.updateOrder(id, updateData);
    
    if (!updatedOrder) {
      return res.status(404).json({ error: "الطلب غير موجود" });
    }
    
    // Note: تتبع الطلبات (order tracking) ليس منفذاً في MemStorage بعد
    // يمكن إضافته لاحقاً إذا لزم الأمر
    
    res.json(updatedOrder);
  } catch (error) {
    console.error("خطأ في تحديث حالة الطلب:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إدارة السائقين
router.get("/drivers", requireAdmin, async (req, res) => {
  try {
    const drivers = await storage.getDrivers();
    
    // ترتيب السائقين حسب تاريخ الإنشاء (الأحدث أولاً)
    const sortedDrivers = drivers.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
    
    res.json(sortedDrivers);
  } catch (error) {
    console.error("خطأ في جلب السائقين:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/drivers", requireAdmin, async (req, res) => {
  try {
    // التحقق من صحة البيانات مع الحقول المطلوبة
    const validatedData = insertDriverSchema.parse({
      ...req.body,
      // تشفير كلمة المرور
      password: await bcrypt.hash(req.body.password, 10),
      // التأكد من وجود الحقول الافتراضية
      isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      earnings: req.body.earnings || "0"
    });
    
    const newDriver = await storage.createDriver(validatedData);
    
    // إخفاء كلمة المرور في الاستجابة
    const { password, ...driverWithoutPassword } = newDriver;
    res.status(201).json(driverWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "بيانات السائق غير صحيحة", 
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    console.error("خطأ في إضافة السائق:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.put("/drivers/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // إعداد البيانات للتحديث
    const updateData = { ...req.body };
    
    // تشفير كلمة المرور الجديدة إذا تم تقديمها
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    // التحقق من صحة البيانات المحدثة (جزئي)
    const validatedData = insertDriverSchema.partial().parse(updateData);
    
    const updatedDriver = await storage.updateDriver(id, validatedData);
    
    if (!updatedDriver) {
      return res.status(404).json({ error: "السائق غير موجود" });
    }
    
    // إخفاء كلمة المرور في الاستجابة
    const { password, ...driverWithoutPassword } = updatedDriver;
    res.json(driverWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "بيانات تحديث السائق غير صحيحة", 
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    console.error("خطأ في تحديث السائق:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/drivers/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await storage.deleteDriver(id);
    
    if (!success) {
      return res.status(404).json({ error: "السائق غير موجود" });
    }
    
    res.json({ success: true, message: "تم حذف السائق بنجاح" });
  } catch (error) {
    console.error("خطأ في حذف السائق:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إحصائيات السائق
router.get("/drivers/:id/stats", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // جلب جميع الطلبات الخاصة بالسائق
    const allOrders = await storage.getOrders();
    let driverOrders = allOrders.filter(order => order.driverId === id);
    
    // تطبيق مرشح التاريخ إذا تم تحديده
    if (startDate) {
      const start = new Date(startDate as string);
      driverOrders = driverOrders.filter(order => order.createdAt >= start);
    }
    if (endDate) {
      const end = new Date(endDate as string);
      driverOrders = driverOrders.filter(order => order.createdAt <= end);
    }
    
    // حساب الإحصائيات
    const totalOrders = driverOrders.length;
    const completedOrders = driverOrders.filter(order => order.status === 'delivered').length;
    const cancelledOrders = driverOrders.filter(order => order.status === 'cancelled').length;
    
    // حساب إجمالي الأرباح (من حقل driverEarnings إذا وجد)
    const totalEarnings = driverOrders.reduce((sum, order) => {
      // افتراض أن driverEarnings موجود في Order أو حسابه من إجمالي الطلب
      const earnings = parseFloat((order as any).driverEarnings || "0");
      return sum + earnings;
    }, 0);
    
    const stats = {
      totalOrders,
      totalEarnings,
      completedOrders,
      cancelledOrders
    };
    
    res.json(stats);
  } catch (error) {
    console.error("خطأ في إحصائيات السائق:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إدارة العروض الخاصة
router.get("/special-offers", requireAdmin, async (req, res) => {
  try {
    const offers = await storage.getSpecialOffers();
    
    // ترتيب العروض حسب تاريخ الإنشاء (الأحدث أولاً)
    const sortedOffers = offers.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
    
    res.json(sortedOffers);
  } catch (error) {
    console.error("خطأ في جلب العروض الخاصة:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/special-offers", requireAdmin, async (req, res) => {
  try {
    // التحقق من صحة البيانات مع الحقول المطلوبة
    const validatedData = insertSpecialOfferSchema.parse({
      ...req.body,
      // إضافة صورة افتراضية إذا لم تكن موجودة
      image: req.body.image || "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
      // التأكد من وجود الحقول الافتراضية
      minimumOrder: req.body.minimumOrder || "0",
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });
    
    const newOffer = await storage.createSpecialOffer(validatedData);
    res.status(201).json(newOffer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "بيانات العرض الخاص غير صحيحة", 
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    console.error("خطأ في إضافة العرض الخاص:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.put("/special-offers/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // التحقق من صحة البيانات المحدثة (جزئي)
    const validatedData = insertSpecialOfferSchema.partial().parse(req.body);
    
    const updatedOffer = await storage.updateSpecialOffer(id, validatedData);
    
    if (!updatedOffer) {
      return res.status(404).json({ error: "العرض الخاص غير موجود" });
    }
    
    res.json(updatedOffer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "بيانات تحديث العرض الخاص غير صحيحة", 
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    console.error("خطأ في تحديث العرض الخاص:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/special-offers/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await storage.deleteSpecialOffer(id);
    
    if (!success) {
      return res.status(404).json({ error: "العرض الخاص غير موجود" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("خطأ في حذف العرض الخاص:", error);
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

// إدارة الملف الشخصي للمدير
router.get("/profile", requireAdmin, async (req: any, res) => {
  try {
    const admin = req.admin;
    // إرجاع بيانات المدير (بدون كلمة المرور)
    const adminProfile = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      username: admin.username,
      phone: admin.phone,
      userType: admin.userType,
      isActive: admin.isActive,
      createdAt: admin.createdAt
    };
    
    res.json(adminProfile);
  } catch (error) {
    console.error("خطأ في جلب الملف الشخصي:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// تحديث الملف الشخصي للمدير
router.put("/profile", requireAdmin, async (req: any, res) => {
  try {
    const { name, email, username, phone } = req.body;
    const adminId = req.admin.id;

    if (!name || !email) {
      return res.status(400).json({ error: "الاسم والبريد الإلكتروني مطلوبان" });
    }

    // التحقق من عدم تكرار البريد الإلكتروني
    const existingAdmin = await db.select().from(schema.adminUsers).where(
      and(
        eq(schema.adminUsers.email, email),
        sql`${schema.adminUsers.id} != ${adminId}`
      )
    );

    if (existingAdmin.length > 0) {
      return res.status(400).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
    }

    // تحديث البيانات
    const [updatedAdmin] = await db.update(schema.adminUsers)
      .set({
        name,
        email,
        username: username || null,
        phone: phone || null
      })
      .where(eq(schema.adminUsers.id, adminId))
      .returning();

    if (!updatedAdmin) {
      return res.status(404).json({ error: "المدير غير موجود" });
    }

    // إرجاع البيانات المحدثة (بدون كلمة المرور)
    const adminProfile = {
      id: updatedAdmin.id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      username: updatedAdmin.username,
      phone: updatedAdmin.phone,
      userType: updatedAdmin.userType,
      isActive: updatedAdmin.isActive,
      createdAt: updatedAdmin.createdAt
    };

    res.json(adminProfile);
  } catch (error) {
    console.error("خطأ في تحديث الملف الشخصي:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// تغيير كلمة المرور للمدير
router.put("/change-password", requireAdmin, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "كلمة المرور الحالية والجديدة مطلوبتان" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    }

    // Get current admin/driver info from storage
    const currentDriver = await storage.getDriver(adminId);
    if (!currentDriver) {
      return res.status(404).json({ error: "المدير غير موجود" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentDriver.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة" });
    }

    // تشفير كلمة المرور الجديدة
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // تحديث كلمة المرور باستخدام storage interface
    await storage.updateDriver(adminId, {
      password: hashedNewPassword
    });

    res.json({ message: "تم تغيير كلمة المرور بنجاح" });
  } catch (error) {
    console.error("خطأ في تغيير كلمة المرور:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export { router as adminRoutes };