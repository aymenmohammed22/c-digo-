import express from "express";
import { dbStorage } from "../db.js";
import * as schema from "../../shared/schema.js";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

const router = express.Router();

// جلب التصنيفات
router.get("/categories", async (req, res) => {
  try {
    const categories = await dbStorage.getCategories();
    res.json(categories);
  } catch (error) {
    console.error("خطأ في جلب التصنيفات:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// جلب المطاعم
router.get("/restaurants", async (req, res) => {
  try {
    const { categoryId, search } = req.query;
    
    let restaurants;
    if (search) {
      restaurants = await dbStorage.searchRestaurants(`%${search}%`, categoryId as string);
    } else if (categoryId && categoryId !== 'all') {
      restaurants = await dbStorage.getRestaurantsByCategory(categoryId as string);
    } else {
      restaurants = await dbStorage.getRestaurants();
    }

    res.json(restaurants);
  } catch (error) {
    console.error("خطأ في جلب المطاعم:", error);
    res.status(500).json({ message: "Failed to fetch restaurants" });
  }
});

// جلب تفاصيل مطعم محدد
router.get("/restaurants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const restaurant = await dbStorage.getRestaurant(id);

    if (!restaurant) {
      return res.status(404).json({ message: "المطعم غير موجود" });
    }

    res.json(restaurant);
  } catch (error) {
    console.error("خطأ في جلب تفاصيل المطعم:", error);
    res.status(500).json({ message: "Failed to fetch restaurant" });
  }
});

// جلب قائمة مطعم
router.get("/restaurants/:id/menu", async (req, res) => {
  try {
    const { id } = req.params;
    
    // التحقق من وجود المطعم
    const restaurant = await dbStorage.getRestaurant(id);

    if (!restaurant) {
      return res.status(404).json({ message: "المطعم غير موجود" });
    }

    // جلب عناصر القائمة
    const menuItems = await dbStorage.getMenuItems(id);

    res.json({
      restaurant,
      menu: [],
      allItems: menuItems
    });
  } catch (error) {
    console.error("خطأ في جلب قائمة المطعم:", error);
    res.status(500).json({ message: "Failed to fetch menu items" });
  }
});

// جلب العروض الخاصة
router.get("/special-offers", async (req, res) => {
  try {
    const { restaurantId, categoryId } = req.query;
    
    let whereConditions = [eq(schema.specialOffers.isActive, true)];
    
    if (restaurantId) {
      whereConditions.push(eq(schema.specialOffers.restaurantId, restaurantId as string));
    }
    
    if (categoryId) {
      whereConditions.push(eq(schema.specialOffers.categoryId, categoryId as string));
    }

    const offers = await db.query.specialOffers.findMany({
      where: and(...whereConditions),
      orderBy: [desc(schema.specialOffers.createdAt)]
    });

    res.json(offers);
  } catch (error) {
    console.error("خطأ في جلب العروض الخاصة:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// إنشاء طلب جديد
router.post("/orders", async (req, res) => {
  try {
    const orderData = req.body;
    
    // توليد رقم طلب فريد
    const orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const newOrderData = {
      ...orderData,
      orderNumber,
      status: "pending",
      paymentStatus: "pending"
    };

    const [newOrder] = await db.insert(schema.orders)
      .values(newOrderData)
      .returning();

    // إضافة تتبع للطلب
    await db.insert(schema.orderTracking).values({
      orderId: newOrder.id,
      status: "pending",
      message: "تم إنشاء الطلب بنجاح",
      createdByType: 'system'
    });

    // إشعار المطعم (يمكن إضافة WebSocket هنا)
    
    res.json(newOrder);
  } catch (error) {
    console.error("خطأ في إنشاء الطلب:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// تتبع الطلب
router.get("/orders/:id/track", async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.id, id),
    });

    if (!order) {
      return res.status(404).json({ error: "الطلب غير موجود" });
    }

    // جلب تتبع الطلب
    const tracking = await db.query.orderTracking.findMany({
      where: eq(schema.orderTracking.orderId, id),
      orderBy: desc(schema.orderTracking.timestamp!)
    });

    res.json({
      order,
      tracking
    });
  } catch (error) {
    console.error("خطأ في تتبع الطلب:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// جلب إعدادات النظام العامة
router.get("/settings", async (req, res) => {
  try {
    const settings = await db.query.systemSettings.findMany({
      where: eq(schema.systemSettings.isPublic, true)
    });
    
    // تحويل الإعدادات إلى كائن
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as any);
    
    res.json(settingsObject);
  } catch (error) {
    console.error("خطأ في جلب الإعدادات:", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// البحث العام
router.get("/search", async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    
    if (!q) {
      return res.json({ restaurants: [], categories: [], menuItems: [] });
    }

    const searchTerm = `%${q}%`;
    let results: any = { restaurants: [], categories: [], menuItems: [] };

    if (type === 'all' || type === 'restaurants') {
      results.restaurants = await dbStorage.searchRestaurants(searchTerm);
    }

    if (type === 'all' || type === 'categories') {
      results.categories = await dbStorage.searchCategories(searchTerm);
    }

    if (type === 'all' || type === 'menu') {
      results.menuItems = await dbStorage.searchMenuItems(searchTerm);
    }

    res.json(results);
  } catch (error) {
    console.error("خطأ في البحث:", error);
    res.status(500).json({ message: "Failed to search" });
  }
});

export { router as publicRoutes };