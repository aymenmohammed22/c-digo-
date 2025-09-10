import type { Express } from "express";
import { createServer, type Server } from "http";
import { dbStorage } from "./db";
import { authService } from "./auth";
import { 
  insertRestaurantSchema, 
  insertMenuItemSchema, 
  insertOrderSchema, 
  insertDriverSchema, 
  insertCategorySchema, 
  insertSpecialOfferSchema,
  insertUiSettingsSchema,
  insertRestaurantSectionSchema,
  insertRatingSchema,
  insertNotificationSchema,
  insertWalletSchema,
  insertWalletTransactionSchema,
  insertSystemSettingsSchema,
  insertRestaurantEarningsSchema,
  insertUserSchema,
  orders
} from "@shared/schema";
import { randomUUID } from "crypto";
import { eq, and, gte, lte, desc, isNull } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize default admin user on startup
  await authService.createDefaultAdmin();
  
  // Admin Authentication Routes
  app.post("/api/admin/login", async (req, res) => {
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
      console.error('خطأ في تسجيل الدخول:', error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/admin/logout", async (req, res) => {
    try {
      const { token } = req.body;
      if (token) {
        await dbStorage.deleteAdminSession(token);
      }
      res.json({ message: "تم تسجيل الخروج بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.get("/api/admin/verify", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({ message: "رمز التحقق مطلوب" });
      }

      const validation = await authService.validateSession(token);
      
      if (validation.valid) {
        res.json({
          valid: true,
          userType: validation.userType,
          adminId: validation.adminId
        });
      } else {
        res.status(401).json({ message: "انتهت صلاحية الجلسة" });
      }
    } catch (error) {
      console.error('خطأ في التحقق:', error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // Users
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await dbStorage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب بيانات المستخدم" });
    }
  });

  app.get("/api/users/username/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await dbStorage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب بيانات المستخدم" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await dbStorage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "بيانات المستخدم غير صحيحة" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertUserSchema.partial().parse(req.body);
      const user = await dbStorage.updateUser(id, validatedData);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "بيانات المستخدم غير صحيحة" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await dbStorage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await dbStorage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await dbStorage.updateCategory(id, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await dbStorage.deleteCategory(id);
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Restaurants
  app.get("/api/restaurants", async (req, res) => {
    try {
      const { categoryId } = req.query;
      let restaurants;
      
      if (categoryId) {
        restaurants = await dbStorage.getRestaurantsByCategory(categoryId as string);
      } else {
        restaurants = await dbStorage.getRestaurants();
      }
      
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const restaurant = await dbStorage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  app.post("/api/restaurants", async (req, res) => {
    try {
      const validatedData = insertRestaurantSchema.parse(req.body);
      const restaurant = await dbStorage.createRestaurant(validatedData);
      res.status(201).json(restaurant);
    } catch (error) {
      res.status(400).json({ message: "Invalid restaurant data" });
    }
  });

  app.put("/api/restaurants/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertRestaurantSchema.partial().parse(req.body);
      const restaurant = await dbStorage.updateRestaurant(id, validatedData);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      res.status(400).json({ message: "Invalid restaurant data" });
    }
  });

  app.delete("/api/restaurants/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await dbStorage.deleteRestaurant(id);
      if (!success) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete restaurant" });
    }
  });

  // Menu Items
  app.get("/api/restaurants/:restaurantId/menu", async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const menuItems = await dbStorage.getMenuItems(restaurantId);
      res.json(menuItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.post("/api/menu-items", async (req, res) => {
    try {
      const validatedData = insertMenuItemSchema.parse(req.body);
      const menuItem = await dbStorage.createMenuItem(validatedData);
      res.status(201).json(menuItem);
    } catch (error) {
      res.status(400).json({ message: "Invalid menu item data" });
    }
  });

  app.put("/api/menu-items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertMenuItemSchema.partial().parse(req.body);
      const menuItem = await dbStorage.updateMenuItem(id, validatedData);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      res.json(menuItem);
    } catch (error) {
      res.status(400).json({ message: "Invalid menu item data" });
    }
  });

  app.delete("/api/menu-items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await dbStorage.deleteMenuItem(id);
      if (!success) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete menu item" });
    }
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    try {
      const { restaurantId } = req.query;
      let orders;
      
      if (restaurantId) {
        orders = await dbStorage.getOrdersByRestaurant(restaurantId as string);
      } else {
        orders = await dbStorage.getOrders();
      }
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await dbStorage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await dbStorage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertOrderSchema.partial().parse(req.body);
      const order = await dbStorage.updateOrder(id, validatedData);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  // Drivers
  app.get("/api/drivers", async (req, res) => {
    try {
      const { available } = req.query;
      let drivers;
      
      if (available === 'true') {
        drivers = await dbStorage.getAvailableDrivers();
      } else {
        drivers = await dbStorage.getDrivers();
      }
      
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  app.get("/api/drivers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const driver = await dbStorage.getDriver(id);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch driver" });
    }
  });

  app.post("/api/drivers", async (req, res) => {
    try {
      const validatedData = insertDriverSchema.parse(req.body);
      const driver = await dbStorage.createDriver(validatedData);
      res.status(201).json(driver);
    } catch (error) {
      res.status(400).json({ message: "Invalid driver data" });
    }
  });

  app.put("/api/drivers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertDriverSchema.partial().parse(req.body);
      const driver = await dbStorage.updateDriver(id, validatedData);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(400).json({ message: "Invalid driver data" });
    }
  });

  app.delete("/api/drivers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await dbStorage.deleteDriver(id);
      if (!success) {
        return res.status(404).json({ message: "Driver not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete driver" });
    }
  });

  // Special Offers
  app.get("/api/special-offers", async (req, res) => {
    try {
      const { active } = req.query;
      let offers;
      
      if (active === 'true') {
        offers = await dbStorage.getActiveSpecialOffers();
      } else {
        offers = await dbStorage.getSpecialOffers();
      }
      
      res.json(offers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch special offers" });
    }
  });

  app.post("/api/special-offers", async (req, res) => {
    try {
      const validatedData = insertSpecialOfferSchema.parse(req.body);
      const offer = await dbStorage.createSpecialOffer(validatedData);
      res.status(201).json(offer);
    } catch (error) {
      res.status(400).json({ message: "Invalid special offer data" });
    }
  });

  app.put("/api/special-offers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSpecialOfferSchema.partial().parse(req.body);
      const offer = await dbStorage.updateSpecialOffer(id, validatedData);
      if (!offer) {
        return res.status(404).json({ message: "Special offer not found" });
      }
      res.json(offer);
    } catch (error) {
      res.status(400).json({ message: "Invalid special offer data" });
    }
  });

  app.delete("/api/special-offers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await dbStorage.deleteSpecialOffer(id);
      if (!success) {
        return res.status(404).json({ message: "Special offer not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete special offer" });
    }
  });

  // UI Settings Routes
  app.get("/api/ui-settings", async (req, res) => {
    try {
      const settings = await dbStorage.getUiSettings();
      res.json(settings);
    } catch (error) {
      console.error('خطأ في جلب إعدادات الواجهة:', error);
      res.status(500).json({ message: "Failed to fetch UI settings" });
    }
  });

  app.get("/api/ui-settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await dbStorage.getUiSetting(key);
      if (!setting) {
        return res.status(404).json({ message: "الإعداد غير موجود" });
      }
      res.json(setting);
    } catch (error) {
      console.error('خطأ في جلب إعداد الواجهة:', error);
      res.status(500).json({ message: "Failed to fetch UI setting" });
    }
  });

  app.put("/api/ui-settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: "قيمة الإعداد مطلوبة" });
      }

      const updated = await dbStorage.updateUiSetting(key, value);
      if (!updated) {
        return res.status(404).json({ message: "الإعداد غير موجود" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error('خطأ في تحديث إعداد الواجهة:', error);
      res.status(500).json({ message: "Failed to update UI setting" });
    }
  });

  // Driver-specific endpoints
  app.get("/api/drivers/:id/orders", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.query;
      
      const db = dbStorage.db;
      let driverOrders;
      
      if (status) {
        driverOrders = await db.select().from(orders).where(and(eq(orders.driverId, id), eq(orders.status, status as string))).orderBy(desc(orders.createdAt));
      } else {
        driverOrders = await db.select().from(orders).where(eq(orders.driverId, id)).orderBy(desc(orders.createdAt));
      }
      
      res.json(driverOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch driver orders" });
    }
  });

  app.put("/api/drivers/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, latitude, longitude } = req.body;
      
      const driver = await dbStorage.updateDriver(id, {
        isAvailable: status === 'available',
        currentLocation: latitude && longitude ? `${latitude},${longitude}` : undefined,
      });
      
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      res.json(driver);
    } catch (error) {
      res.status(400).json({ message: "Failed to update driver status" });
    }
  });

  app.post("/api/drivers/:id/accept-order", async (req, res) => {
    try {
      const { id: driverId } = req.params;
      const { orderId } = req.body;
      
      // Update order status and assign driver
      const db = dbStorage.db;
      const [updatedOrder] = await db
        .update(orders)
        .set({ 
          driverId: driverId,
          status: 'accepted',
        })
        .where(eq(orders.id, orderId))
        .returning();
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Update driver availability
      await dbStorage.updateDriver(driverId, { isAvailable: false });
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: "Failed to accept order" });
    }
  });

  app.post("/api/drivers/:id/complete-order", async (req, res) => {
    try {
      const { id: driverId } = req.params;
      const { orderId } = req.body;
      
      // Update order status
      const db = dbStorage.db;
      const [updatedOrder] = await db
        .update(orders)
        .set({ 
          status: 'delivered',
        })
        .where(eq(orders.id, orderId))
        .returning();
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Update driver availability
      await dbStorage.updateDriver(driverId, { isAvailable: true });
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: "Failed to complete order" });
    }
  });

  app.get("/api/drivers/:id/stats", async (req, res) => {
    try {
      const { id } = req.params;
      const { period = 'today' } = req.query;
      
      let startDate: Date;
      const endDate = new Date();
      
      switch (period) {
        case 'today':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
      }
      
      const db = dbStorage.db;
      const driverOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.driverId, id),
            eq(orders.status, 'delivered'),
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        );
      
      const totalEarnings = driverOrders.reduce((sum: number, order: any) => {
        return sum + (parseFloat(order.totalAmount) || 0);
      }, 0);
      
      const stats = {
        totalOrders: driverOrders.length,
        totalEarnings,
        avgOrderValue: driverOrders.length > 0 ? totalEarnings / driverOrders.length : 0,
        period,
        startDate,
        endDate
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch driver stats" });
    }
  });

  app.get("/api/drivers/:id/available-orders", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get orders that are pending and near the driver's location
      const db = dbStorage.db;
      const availableOrders = await db
        .select({
          id: orders.id,
          totalAmount: orders.totalAmount,
          status: orders.status,
          createdAt: orders.createdAt,
          deliveryAddress: orders.deliveryAddress,
          restaurantId: orders.restaurantId,
          customerName: orders.customerName,
        })
        .from(orders)
        .where(
          and(
            eq(orders.status, 'pending'),
            isNull(orders.driverId)
          )
        )
        .orderBy(desc(orders.createdAt))
        .limit(10);
      
      res.json(availableOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available orders" });
    }
  });

  // ================= RESTAURANT SECTIONS API =================
  app.get("/api/restaurants/:restaurantId/sections", async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const sections = await dbStorage.getRestaurantSections(restaurantId);
      res.json(sections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurant sections" });
    }
  });

  app.post("/api/restaurants/:restaurantId/sections", async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const validatedData = insertRestaurantSectionSchema.parse({
        ...req.body,
        restaurantId
      });
      const section = await dbStorage.createRestaurantSection(validatedData);
      res.status(201).json(section);
    } catch (error) {
      res.status(400).json({ message: "Invalid section data" });
    }
  });

  app.put("/api/restaurant-sections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertRestaurantSectionSchema.partial().parse(req.body);
      const section = await dbStorage.updateRestaurantSection(id, validatedData);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      res.json(section);
    } catch (error) {
      res.status(400).json({ message: "Invalid section data" });
    }
  });

  app.delete("/api/restaurant-sections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await dbStorage.deleteRestaurantSection(id);
      if (!success) {
        return res.status(404).json({ message: "Section not found" });
      }
      res.json({ message: "Section deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete section" });
    }
  });

  // ================= RATINGS & REVIEWS API =================
  app.get("/api/ratings", async (req, res) => {
    try {
      const { restaurantId, approved } = req.query;
      const ratings = await dbStorage.getRatings(restaurantId as string, approved === 'true');
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  app.post("/api/ratings", async (req, res) => {
    try {
      const validatedData = insertRatingSchema.parse(req.body);
      const rating = await dbStorage.createRating(validatedData);
      res.status(201).json(rating);
    } catch (error) {
      res.status(400).json({ message: "Invalid rating data" });
    }
  });

  app.put("/api/ratings/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { approved } = req.body;
      const rating = await dbStorage.updateRating(id, { isApproved: approved });
      if (!rating) {
        return res.status(404).json({ message: "Rating not found" });
      }
      res.json(rating);
    } catch (error) {
      res.status(400).json({ message: "Failed to update rating" });
    }
  });

  app.delete("/api/ratings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await dbStorage.deleteRating(id);
      if (!success) {
        return res.status(404).json({ message: "Rating not found" });
      }
      res.json({ message: "Rating deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete rating" });
    }
  });

  // ================= NOTIFICATIONS API =================
  app.get("/api/notifications", async (req, res) => {
    try {
      const { recipientType, recipientId, unread } = req.query;
      const notifications = await dbStorage.getNotifications(
        recipientType as string, 
        recipientId as string, 
        unread === 'true'
      );
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await dbStorage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      res.status(400).json({ message: "Invalid notification data" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await dbStorage.markNotificationAsRead(id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(400).json({ message: "Failed to update notification" });
    }
  });

  // ================= WALLET & PAYMENTS API =================
  app.get("/api/wallets/:phone", async (req, res) => {
    try {
      const { phone } = req.params;
      const wallet = await dbStorage.getWallet(phone);
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  app.post("/api/wallets", async (req, res) => {
    try {
      const validatedData = insertWalletSchema.parse(req.body);
      const wallet = await dbStorage.createWallet(validatedData);
      res.status(201).json(wallet);
    } catch (error) {
      res.status(400).json({ message: "Invalid wallet data" });
    }
  });

  app.post("/api/wallet-transactions", async (req, res) => {
    try {
      const validatedData = insertWalletTransactionSchema.parse(req.body);
      const transaction = await dbStorage.createWalletTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  app.get("/api/wallets/:phone/transactions", async (req, res) => {
    try {
      const { phone } = req.params;
      const transactions = await dbStorage.getWalletTransactions(phone);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // ================= SYSTEM SETTINGS API =================
  app.get("/api/system-settings", async (req, res) => {
    try {
      const { category } = req.query;
      const settings = await dbStorage.getSystemSettings(category as string);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  app.put("/api/system-settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const setting = await dbStorage.updateSystemSetting(key, value);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(400).json({ message: "Failed to update setting" });
    }
  });

  // ================= RESTAURANT EARNINGS API =================
  app.get("/api/restaurant-earnings", async (req, res) => {
    try {
      const earnings = await dbStorage.getRestaurantEarnings();
      res.json(earnings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurant earnings" });
    }
  });

  app.get("/api/restaurant-earnings/:restaurantId", async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const earnings = await dbStorage.getRestaurantEarningsByRestaurant(restaurantId);
      res.json(earnings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurant earnings" });
    }
  });

  app.post("/api/restaurant-earnings", async (req, res) => {
    try {
      const validatedData = insertRestaurantEarningsSchema.parse(req.body);
      const earnings = await dbStorage.createRestaurantEarnings(validatedData);
      res.status(201).json(earnings);
    } catch (error) {
      res.status(400).json({ message: "Invalid earnings data" });
    }
  });

  app.put("/api/restaurant-earnings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertRestaurantEarningsSchema.partial().parse(req.body);
      const earnings = await dbStorage.updateRestaurantEarnings(id, validatedData);
      if (!earnings) {
        return res.status(404).json({ message: "Earnings not found" });
      }
      res.json(earnings);
    } catch (error) {
      res.status(400).json({ message: "Invalid earnings data" });
    }
  });

  // ================= ANALYTICS & REPORTS API =================
  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const analytics = await dbStorage.getDashboardAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/sales-report", async (req, res) => {
    try {
      const { startDate, endDate, restaurantId } = req.query;
      const report = await dbStorage.getSalesReport(
        startDate as string, 
        endDate as string, 
        restaurantId as string
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales report" });
    }
  });

  app.get("/api/analytics/driver-performance", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const performance = await dbStorage.getDriverPerformance(
        startDate as string, 
        endDate as string
      );
      res.json(performance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch driver performance" });
    }
  });

  // ================= ADVANCED ORDER MANAGEMENT =================
  app.put("/api/orders/:id/assign-driver", async (req, res) => {
    try {
      const { id } = req.params;
      const { driverId } = req.body;
      
      // Update order with driver
      const order = await dbStorage.updateOrder(id, { 
        driverId,
        status: 'assigned',
        updatedAt: new Date()
      });
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Create notification for driver
      await dbStorage.createNotification({
        type: 'order',
        title: 'طلب جديد',
        message: `تم تكليفك بطلب جديد رقم ${id.slice(0, 8)}`,
        recipientType: 'driver',
        recipientId: driverId,
        orderId: id
      });
      
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Failed to assign driver" });
    }
  });

  app.get("/api/orders/track/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await dbStorage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      let driverLocation = null;
      if (order.driverId) {
        const driver = await dbStorage.getDriver(order.driverId);
        if (driver) {
          driverLocation = driver.currentLocation;
        }
      }
      
      res.json({
        ...order,
        driverLocation
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to track order" });
    }
  });

  // Search Routes
  app.get("/api/search", async (req, res) => {
    try {
      const { q: query, category } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
      }

      const searchTerm = `%${query}%`;
      
      const restaurants = await dbStorage.searchRestaurants(searchTerm, category as string);
      const categories = await dbStorage.searchCategories(searchTerm);
      const menuItems = await dbStorage.searchMenuItems(searchTerm);

      res.json({
        restaurants,
        categories,
        menuItems,
        total: restaurants.length + categories.length + menuItems.length
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
