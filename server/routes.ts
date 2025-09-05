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
  insertUserAddressSchema,
  insertRestaurantSectionSchema,
  insertUserWalletSchema,
  insertWalletTransactionSchema,
  insertOrderRatingSchema,
  insertNotificationSchema,
  insertDriverSessionSchema,
  insertOrderTrackingSchema,
  insertRestaurantEarningsSchema,
  insertDriverEarningsSchema,
  insertPaymentSettingsSchema,
  insertDeliveryPricingSchema,
  insertLanguageSchema,
  insertContentManagementSchema
} from "@shared/schema";
import { randomUUID } from "crypto";

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

  // User Addresses Routes
  app.get("/api/users/:userId/addresses", async (req, res) => {
    try {
      const { userId } = req.params;
      const addresses = await dbStorage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user addresses" });
    }
  });

  app.post("/api/users/:userId/addresses", async (req, res) => {
    try {
      const { userId } = req.params;
      const validatedData = insertUserAddressSchema.parse({ ...req.body, userId });
      const address = await dbStorage.createUserAddress(validatedData);
      res.status(201).json(address);
    } catch (error) {
      res.status(400).json({ message: "Invalid address data" });
    }
  });

  app.put("/api/addresses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertUserAddressSchema.partial().parse(req.body);
      const address = await dbStorage.updateUserAddress(id, validatedData);
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      res.json(address);
    } catch (error) {
      res.status(400).json({ message: "Invalid address data" });
    }
  });

  app.delete("/api/addresses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await dbStorage.deleteUserAddress(id);
      if (!success) {
        return res.status(404).json({ message: "Address not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete address" });
    }
  });

  // Restaurant Sections Routes
  app.get("/api/restaurants/:restaurantId/sections", async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const sections = await dbStorage.getRestaurantSections(restaurantId);
      res.json(sections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurant sections" });
    }
  });

  app.post("/api/restaurant-sections", async (req, res) => {
    try {
      const validatedData = insertRestaurantSectionSchema.parse(req.body);
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
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete section" });
    }
  });

  // User Wallet Routes
  app.get("/api/users/:userId/wallet", async (req, res) => {
    try {
      const { userId } = req.params;
      let wallet = await dbStorage.getUserWallet(userId);
      
      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = await dbStorage.createUserWallet({
          userId,
          balance: "0",
          totalEarnings: "0",
          totalSpent: "0"
        });
      }
      
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  app.post("/api/users/:userId/wallet/transactions", async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, type, description, referenceId } = req.body;
      
      if (!amount || !type || !description) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get or create wallet
      let wallet = await dbStorage.getUserWallet(userId);
      if (!wallet) {
        wallet = await dbStorage.createUserWallet({
          userId,
          balance: "0",
          totalEarnings: "0",
          totalSpent: "0"
        });
      }

      // Create transaction
      const transaction = await dbStorage.createWalletTransaction({
        walletId: wallet.id,
        userId,
        type,
        amount,
        description,
        referenceId: referenceId || null,
        status: "completed"
      });

      // Update wallet balance
      const updatedWallet = await dbStorage.updateWalletBalance(userId, amount, type);

      res.status(201).json({
        transaction,
        wallet: updatedWallet
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to create transaction" });
    }
  });

  app.get("/api/users/:userId/wallet/transactions", async (req, res) => {
    try {
      const { userId } = req.params;
      const transactions = await dbStorage.getWalletTransactions(userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Order Ratings Routes
  app.post("/api/orders/:orderId/rating", async (req, res) => {
    try {
      const { orderId } = req.params;
      const validatedData = insertOrderRatingSchema.parse({ ...req.body, orderId });
      const rating = await dbStorage.createOrderRating(validatedData);
      res.status(201).json(rating);
    } catch (error) {
      res.status(400).json({ message: "Invalid rating data" });
    }
  });

  app.get("/api/orders/:orderId/rating", async (req, res) => {
    try {
      const { orderId } = req.params;
      const rating = await dbStorage.getOrderRating(orderId);
      if (!rating) {
        return res.status(404).json({ message: "Rating not found" });
      }
      res.json(rating);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rating" });
    }
  });

  app.get("/api/restaurants/:restaurantId/ratings", async (req, res) => {
    try {
      const { restaurantId } = req.params;
      const ratings = await dbStorage.getOrderRatings(restaurantId);
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  // Notifications Routes
  app.get("/api/users/:userId/notifications", async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications = await dbStorage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/drivers/:driverId/notifications", async (req, res) => {
    try {
      const { driverId } = req.params;
      const notifications = await dbStorage.getDriverNotifications(driverId);
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
      const success = await dbStorage.markNotificationAsRead(id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // Payment Settings Routes
  app.get("/api/payment-settings", async (req, res) => {
    try {
      const settings = await dbStorage.getPaymentSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment settings" });
    }
  });

  app.post("/api/payment-settings", async (req, res) => {
    try {
      const validatedData = insertPaymentSettingsSchema.parse(req.body);
      const setting = await dbStorage.createPaymentSetting(validatedData);
      res.status(201).json(setting);
    } catch (error) {
      res.status(400).json({ message: "Invalid payment setting data" });
    }
  });

  app.put("/api/payment-settings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertPaymentSettingsSchema.partial().parse(req.body);
      const setting = await dbStorage.updatePaymentSetting(id, validatedData);
      if (!setting) {
        return res.status(404).json({ message: "Payment setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(400).json({ message: "Invalid payment setting data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
