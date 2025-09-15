import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { dbStorage } from "./db";
import { log } from "./vite";
import { authService } from "./auth";
import { customerRoutes } from "./routes/customer";
import driverRoutes from "./routes/driver";
import ordersRoutes from "./routes/orders";
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
  insertCartSchema,
  insertFavoritesSchema,
  orders
} from "@shared/schema";
import { randomUUID } from "crypto";
import { eq, and, gte, lte, desc, isNull } from "drizzle-orm";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
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
        await storage.deleteAdminSession ? storage.deleteAdminSession(token) : Promise.resolve();
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

  // Driver login route
  app.post("/api/driver/login", async (req, res) => {
    try {
      console.log('🚛 Driver login attempt:', req.body);
      const { phone, password } = req.body;

      const admin = await storage.getAdminByPhone ? await storage.getAdminByPhone(phone) : null;
      
      if (!admin || admin.userType !== 'driver') {
        return res.status(401).json({ error: "بيانات دخول خاطئة" });
      }

      // Use AuthService to verify password
      const isPasswordValid = await authService.verifyPassword(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "بيانات دخول خاطئة" });
      }

      if (!admin.isActive) {
        return res.status(401).json({ error: "الحساب غير نشط" });
      }

      // Generate secure token
      const token = `driver_${randomUUID()}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create session
      await storage.createAdminSession({
        adminId: admin.id,
        token,
        userType: "driver",
        expiresAt
      });

      res.json({
        success: true,
        token,
        driver: {
          id: admin.id,
          name: admin.name,
          phone: admin.phone,
          userType: admin.userType
        }
      });
    } catch (error) {
      console.error("خطأ في تسجيل دخول السائق:", error);
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  });

  // Admin Profile routes
  app.get("/api/admin/profile", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({ message: "رمز التحقق مطلوب" });
      }

      const validation = await authService.validateSession(token);
      if (!validation.valid) {
        return res.status(401).json({ message: "انتهت صلاحية الجلسة" });
      }

      const admin = await storage.getAdminById(validation.adminId);
      if (!admin) {
        return res.status(404).json({ message: "المدير غير موجود" });
      }

      res.json({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        username: admin.username,
        phone: admin.phone
      });
    } catch (error) {
      console.error('خطأ في جلب الملف الشخصي:', error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.put("/api/admin/profile", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({ message: "رمز التحقق مطلوب" });
      }

      const validation = await authService.validateSession(token);
      if (!validation.valid) {
        return res.status(401).json({ message: "انتهت صلاحية الجلسة" });
      }

      const { name, email, username, phone } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ message: "الاسم والبريد الإلكتروني مطلوبان" });
      }

      const updatedAdmin = await storage.updateAdmin(validation.adminId, {
        name,
        email,
        username: username || null,
        phone: phone || null
      });

      if (!updatedAdmin) {
        return res.status(404).json({ message: "المدير غير موجود" });
      }

      res.json({
        message: "تم تحديث الملف الشخصي بنجاح",
        admin: {
          id: updatedAdmin.id,
          name: updatedAdmin.name,
          email: updatedAdmin.email,
          username: updatedAdmin.username,
          phone: updatedAdmin.phone
        }
      });
    } catch (error) {
      console.error('خطأ في تحديث الملف الشخصي:', error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.put("/api/admin/change-password", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({ message: "رمز التحقق مطلوب" });
      }

      const validation = await authService.validateSession(token);
      if (!validation.valid) {
        return res.status(401).json({ message: "انتهت صلاحية الجلسة" });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "كلمة المرور الحالية والجديدة مطلوبتان" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      }

      const admin = await storage.getAdminById(validation.adminId);
      if (!admin) {
        return res.status(404).json({ message: "المدير غير موجود" });
      }

      const isCurrentPasswordValid = await authService.verifyPassword(currentPassword, admin.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "كلمة المرور الحالية غير صحيحة" });
      }

      const hashedNewPassword = await authService.hashPassword(newPassword);
      const updatedAdmin = await storage.updateAdmin(validation.adminId, {
        password: hashedNewPassword
      });

      if (!updatedAdmin) {
        return res.status(404).json({ message: "المدير غير موجود" });
      }

      res.json({ message: "تم تغيير كلمة المرور بنجاح" });
    } catch (error) {
      console.error('خطأ في تغيير كلمة المرور:', error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // Users
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
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
      const user = await storage.getUserByUsername(username);
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
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "بيانات المستخدم غير صحيحة" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, validatedData);
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
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
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
      const success = await storage.deleteCategory(id);
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Enhanced Restaurants with filtering - مطاعم محسنة مع التصفية
  app.get("/api/restaurants", async (req, res) => {
    try {
      const { 
        categoryId, 
        lat, 
        lon, 
        sortBy, 
        isFeatured, 
        isNew, 
        search, 
        radius, 
        isOpen 
      } = req.query;
      
      const filters = {
        categoryId: categoryId as string,
        userLatitude: lat ? parseFloat(lat as string) : undefined,
        userLongitude: lon ? parseFloat(lon as string) : undefined,
        sortBy: sortBy as 'name' | 'rating' | 'deliveryTime' | 'distance' | 'newest',
        isFeatured: isFeatured === 'true',
        isNew: isNew === 'true',
        search: search as string,
        radius: radius ? parseFloat(radius as string) : undefined,
        isOpen: isOpen !== undefined ? isOpen === 'true' : undefined
      };
      
      const restaurants = await storage.getRestaurants(filters);
      res.json(restaurants);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const restaurant = await storage.getRestaurant(id);
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
      const restaurant = await storage.createRestaurant(validatedData);
      res.status(201).json(restaurant);
    } catch (error) {
      res.status(400).json({ message: "Invalid restaurant data" });
    }
  });

  app.put("/api/restaurants/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertRestaurantSchema.partial().parse(req.body);
      const restaurant = await storage.updateRestaurant(id, validatedData);
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
      const success = await storage.deleteRestaurant(id);
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
      const menuItems = await storage.getMenuItems(restaurantId);
      res.json(menuItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.post("/api/menu-items", async (req, res) => {
    try {
      const validatedData = insertMenuItemSchema.parse(req.body);
      const menuItem = await storage.createMenuItem(validatedData);
      res.status(201).json(menuItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code
          }))
        });
      } else {
        return res.status(500).json({ message: "Server error", error: error.message });
      }
    }
  });

  app.put("/api/menu-items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertMenuItemSchema.partial().parse(req.body);
      const menuItem = await storage.updateMenuItem(id, validatedData);
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
      const success = await storage.deleteMenuItem(id);
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
        orders = await storage.getOrdersByRestaurant(restaurantId as string);
      } else {
        orders = await storage.getOrders();
      }
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Orders routes are now handled by the dedicated orders router
  // app.post("/api/orders", ...) - moved to routes/orders.ts

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(id, validatedData);
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
        drivers = await storage.getAvailableDrivers();
      } else {
        drivers = await storage.getDrivers();
      }
      
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  app.get("/api/drivers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const driver = await storage.getDriver(id);
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
      const driver = await storage.createDriver(validatedData);
      res.status(201).json(driver);
    } catch (error) {
      res.status(400).json({ message: "Invalid driver data" });
    }
  });

  app.put("/api/drivers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertDriverSchema.partial().parse(req.body);
      const driver = await storage.updateDriver(id, validatedData);
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
      const success = await storage.deleteDriver(id);
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
      log("🔍 Storage type: " + dbStorage.constructor.name);
      
      // Disable caching to see changes
      res.set('Cache-Control', 'no-store');
      
      const { active } = req.query;
      let offers;
      
      // Default to active offers for homepage
      if (active === 'false') {
        offers = await dbStorage.getSpecialOffers();
      } else {
        offers = await dbStorage.getActiveSpecialOffers();
      }
      
      log("📊 Found offers: " + offers.length + " offers");
      res.json(offers);
    } catch (error) {
      log("خطأ في جلب العروض الخاصة: " + error.message);
      res.status(500).json({ message: "Failed to fetch special offers" });
    }
  });

  app.post("/api/special-offers", async (req, res) => {
    try {
      const validatedData = insertSpecialOfferSchema.parse(req.body);
      const offer = await storage.createSpecialOffer(validatedData);
      res.status(201).json(offer);
    } catch (error) {
      res.status(400).json({ message: "Invalid special offer data" });
    }
  });

  app.put("/api/special-offers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSpecialOfferSchema.partial().parse(req.body);
      const offer = await storage.updateSpecialOffer(id, validatedData);
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
      const success = await storage.deleteSpecialOffer(id);
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
      const settings = await storage.getUiSettings();
      res.json(settings);
    } catch (error) {
      console.error('خطأ في جلب إعدادات الواجهة:', error);
      res.status(500).json({ message: "Failed to fetch UI settings" });
    }
  });

  app.get("/api/ui-settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getUiSetting(key);
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

      const updated = await storage.updateUiSetting(key, value);
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
      
      // Get all orders and filter by driver
      const allOrders = await storage.getOrders();
      let driverOrders = allOrders.filter(order => order.driverId === id);
      
      if (status) {
        driverOrders = driverOrders.filter(order => order.status === status);
      }
      
      // Sort by creation date (newest first)
      driverOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(driverOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch driver orders" });
    }
  });

  app.put("/api/drivers/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, latitude, longitude } = req.body;
      
      const driver = await storage.updateDriver(id, {
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
      const updatedOrder = await storage.updateOrder(orderId, {
        driverId: driverId,
        status: 'accepted',
      });
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Update driver availability
      await storage.updateDriver(driverId, { isAvailable: false });
      
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
      const updatedOrder = await storage.updateOrder(orderId, {
        status: 'delivered',
      });
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Update driver availability
      await storage.updateDriver(driverId, { isAvailable: true });
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: "Failed to complete order" });
    }
  });

  app.get("/api/drivers/:id/stats", async (req, res) => {
    try {
      const { id } = req.params;
      const { period = 'today' } = req.query;
      
      // Validate UUID format (supports both with and without hyphens)
      const uuidRe = /^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$/i;
      if (!id || id.length < 8 || !uuidRe.test(id.replace(/-/g, ''))) {
        return res.status(400).json({ message: "Invalid driver id format" });
      }
      
      // Check if driver exists
      const driver = await storage.getDriver(id);
      if (!driver) {
        // Return zero stats for non-existent driver to keep client stable
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        return res.json({
          totalOrders: 0,
          totalEarnings: 0,
          avgOrderValue: 0,
          period,
          startDate,
          endDate: new Date()
        });
      }
      
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
      
      // Get all orders and filter by driver and status
      const allOrders = await storage.getOrders();
      const driverOrders = allOrders.filter(order => 
        order.driverId === id && 
        order.status === 'delivered' &&
        new Date(order.createdAt) >= startDate &&
        new Date(order.createdAt) <= endDate
      );
      
      const totalEarnings = driverOrders.reduce((sum: number, order: any) => {
        // Prefer driverEarnings for driver-specific calculations
        const amount = order.driverEarnings ?? order.totalAmount ?? order.total ?? 0;
        return sum + parseFloat(amount.toString() || '0');
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
      
      // Get orders that are pending and without assigned driver
      const allOrders = await storage.getOrders();
      const availableOrders = allOrders
        .filter(order => order.status === 'pending' && !order.driverId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(order => ({
          id: order.id,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt,
          deliveryAddress: order.deliveryAddress,
          restaurantId: order.restaurantId,
          customerName: order.customerName,
        }));
      
      res.json(availableOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available orders" });
    }
  });

  // ================= RESTAURANT SECTIONS API - DISABLED =================
  // Restaurant sections functionality temporarily disabled - would require additional database methods

  // ================= RATINGS & REVIEWS API - DISABLED =================
  // Ratings functionality temporarily disabled - would require additional database methods

  // ================= NOTIFICATIONS API =================
  app.get("/api/notifications", async (req, res) => {
    try {
      const { recipientType, recipientId, unread } = req.query;
      const notifications = await storage.getNotifications(
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
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      res.status(400).json({ message: "Invalid notification data" });
    }
  });

  // Mark notification as read endpoint temporarily disabled - requires additional database method
  /*
  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(400).json({ message: "Failed to update notification" });
    }
  });
  */

  // ================= WALLET & PAYMENTS API - DISABLED =================
  // Wallet functionality temporarily disabled - would require additional database methods

  // ================= SYSTEM SETTINGS API - DISABLED =================
  // System settings functionality temporarily disabled - would require additional database methods

  // ================= RESTAURANT EARNINGS API - DISABLED =================
  // Restaurant earnings functionality temporarily disabled - would require additional database methods

  // ================= ANALYTICS & REPORTS API - DISABLED =================
  // Analytics functionality temporarily disabled - would require additional database methods

  // ================= ADVANCED ORDER MANAGEMENT =================
  app.put("/api/orders/:id/assign-driver", async (req, res) => {
    try {
      const { id } = req.params;
      const { driverId } = req.body;
      
      // Update order with driver
      const order = await storage.updateOrder(id, { 
        driverId,
        status: 'assigned',
        updatedAt: new Date()
      });
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Create notification for driver
      await storage.createNotification({
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
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      let driverLocation = null;
      if (order.driverId) {
        const driver = await storage.getDriver(order.driverId);
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

  // Enhanced Search Routes - مسارات البحث المحسنة
  app.get("/api/search", async (req, res) => {
    try {
      const { 
        q: query, 
        category, 
        lat, 
        lon,
        sortBy,
        isFeatured,
        isNew,
        radius,
        type
      } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
      }

      const userLocation = (lat && lon) ? { lat: parseFloat(lat as string), lon: parseFloat(lon as string) } : undefined;
      
      const results: any = {};
      
      if (!type || type === 'restaurants') {
        const filters = {
          search: query as string,
          categoryId: category as string,
          sortBy: sortBy as 'name' | 'rating' | 'deliveryTime' | 'distance' | 'newest',
          isFeatured: isFeatured === 'true',
          isNew: isNew === 'true',
          userLatitude: userLocation?.lat,
          userLongitude: userLocation?.lon,
          radius: radius ? parseFloat(radius as string) : undefined
        };
        // TEMPORARY FIX: Return sample data for search
        console.log('TEMPORARY FIX: Returning sample restaurants for search');
        results.restaurants = [
          {
            id: '1',
            name: 'مطعم الأصالة',
            description: 'مطعم يقدم أشهى الأطباق العربية الأصيلة',
            image: '/images/restaurant1.jpg',
            rating: '4.5'
          }
        ];
      }
      
      if (!type || type === 'categories') {
        results.categories = await storage.searchCategories(query as string);
      }
      
      if (!type || type === 'menu-items') {
        results.menuItems = await storage.searchMenuItemsAdvanced(query as string);
      }
      
      const total = (results.restaurants?.length || 0) + 
                   (results.categories?.length || 0) + 
                   (results.menuItems?.length || 0);

      res.json({ ...results, total });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Cart endpoints - مسارات السلة
  app.get("/api/cart/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ message: 'Failed to fetch cart items' });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const validatedData = insertCartSchema.parse(req.body);
      const newItem = await storage.addToCart(validatedData);
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ message: 'Failed to add item to cart' });
    }
  });

  app.put("/api/cart/:cartId", async (req, res) => {
    try {
      const { cartId } = req.params;
      const { quantity } = req.body;
      
      if (quantity <= 0) {
        await storage.removeFromCart(cartId);
        res.json({ message: 'Item removed from cart' });
      } else {
        const updatedItem = await storage.updateCartItem(cartId, quantity);
        res.json(updatedItem);
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({ message: 'Failed to update cart item' });
    }
  });

  app.delete("/api/cart/:cartId", async (req, res) => {
    try {
      const { cartId } = req.params;
      const success = await storage.removeFromCart(cartId);
      
      if (success) {
        res.json({ message: 'Item removed from cart' });
      } else {
        res.status(404).json({ message: 'Cart item not found' });
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ message: 'Failed to remove item from cart' });
    }
  });

  app.delete("/api/cart/clear/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const success = await storage.clearCart(userId);
      
      if (success) {
        res.json({ message: 'Cart cleared successfully' });
      } else {
        res.status(404).json({ message: 'No cart items found for user' });
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ message: 'Failed to clear cart' });
    }
  });

  // Favorites endpoints - مسارات المفضلة
  app.get("/api/favorites/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const favorites = await storage.getFavoriteRestaurants(userId);
      res.json(favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ message: 'Failed to fetch favorite restaurants' });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const validatedData = insertFavoritesSchema.parse(req.body);
      const newFavorite = await storage.addToFavorites(validatedData);
      res.status(201).json(newFavorite);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      res.status(500).json({ message: 'Failed to add restaurant to favorites' });
    }
  });

  app.delete("/api/favorites/:userId/:restaurantId", async (req, res) => {
    try {
      const { userId, restaurantId } = req.params;
      const success = await storage.removeFromFavorites(userId, restaurantId);
      
      if (success) {
        res.json({ message: 'Restaurant removed from favorites' });
      } else {
        res.status(404).json({ message: 'Favorite not found' });
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      res.status(500).json({ message: 'Failed to remove restaurant from favorites' });
    }
  });

  app.get("/api/favorites/check/:userId/:restaurantId", async (req, res) => {
    try {
      const { userId, restaurantId } = req.params;
      const isFavorite = await storage.isRestaurantFavorite(userId, restaurantId);
      res.json({ isFavorite });
    } catch (error) {
      console.error('Error checking favorite status:', error);
      res.status(500).json({ message: 'Failed to check favorite status' });
    }
  });

  // Register customer routes
  app.use("/api/customer", customerRoutes);
  
  // Register driver routes
  app.use("/api/driver", driverRoutes);
  
  // Register orders routes
  app.use("/api/orders", ordersRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
