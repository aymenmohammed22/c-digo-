import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { 
  users, userAddresses, categories, restaurants, restaurantSections, menuItems, orders, drivers, specialOffers,
  adminUsers, adminSessions, uiSettings, ratings, notifications, wallets, walletTransactions, systemSettings, restaurantEarnings,
  type User, type InsertUser,
  type UserAddress, type InsertUserAddress,
  type Category, type InsertCategory,
  type Restaurant, type InsertRestaurant,
  type RestaurantSection, type InsertRestaurantSection,
  type MenuItem, type InsertMenuItem,
  type Order, type InsertOrder,
  type Driver, type InsertDriver,
  type SpecialOffer, type InsertSpecialOffer,
  type AdminUser, type InsertAdminUser,
  type AdminSession, type InsertAdminSession,
  type UiSettings, type InsertUiSettings,
  type Rating, type InsertRating,
  type Notification, type InsertNotification,
  type Wallet, type InsertWallet,
  type WalletTransaction, type InsertWalletTransaction,
  type SystemSettings, type InsertSystemSettings,
  type RestaurantEarnings, type InsertRestaurantEarnings
} from "@shared/schema";
import { IStorage } from "./storage.ts";
import { eq, and, desc } from "drizzle-orm";

// Database connection
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be defined in environment variables");
    }
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql);
  }
  return db;
}

export class DatabaseStorage implements IStorage {
  get db() {
    return getDb();
  }

  // Admin Authentication
  async createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser> {
    const [newAdmin] = await this.db.insert(adminUsers).values(adminUser).returning();
    return newAdmin;
  }

  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const [admin] = await this.db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return admin;
  }

  async createAdminSession(session: InsertAdminSession): Promise<AdminSession> {
    const [newSession] = await this.db.insert(adminSessions).values(session).returning();
    return newSession;
  }

  async getAdminSession(token: string): Promise<AdminSession | undefined> {
    const [session] = await this.db.select().from(adminSessions).where(eq(adminSessions.token, token));
    return session;
  }

  async deleteAdminSession(token: string): Promise<boolean> {
    const result = await this.db.delete(adminSessions).where(eq(adminSessions.token, token));
    return result.rowCount > 0;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await this.db.insert(users).values(user).returning();
    return newUser;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await this.db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await this.db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await this.db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await this.db.delete(categories).where(eq(categories.id, id));
    return result.rowCount > 0;
  }

  // Restaurants
  async getRestaurants(): Promise<Restaurant[]> {
    return await this.db.select().from(restaurants);
  }

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    const [restaurant] = await this.db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant;
  }

  async getRestaurantsByCategory(categoryId: string): Promise<Restaurant[]> {
    return await this.db.select().from(restaurants).where(eq(restaurants.categoryId, categoryId));
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [newRestaurant] = await this.db.insert(restaurants).values(restaurant).returning();
    return newRestaurant;
  }

  async updateRestaurant(id: string, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const [updated] = await this.db.update(restaurants).set(restaurant).where(eq(restaurants.id, id)).returning();
    return updated;
  }

  async deleteRestaurant(id: string): Promise<boolean> {
    const result = await this.db.delete(restaurants).where(eq(restaurants.id, id));
    return result.rowCount > 0;
  }

  // Menu Items
  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    return await this.db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    const [item] = await this.db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem> {
    const [newItem] = await this.db.insert(menuItems).values(menuItem).returning();
    return newItem;
  }

  async updateMenuItem(id: string, menuItem: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updated] = await this.db.update(menuItems).set(menuItem).where(eq(menuItems.id, id)).returning();
    return updated;
  }

  async deleteMenuItem(id: string): Promise<boolean> {
    const result = await this.db.delete(menuItems).where(eq(menuItems.id, id));
    return result.rowCount > 0;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return await this.db.select().from(orders);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await this.db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    return await this.db.select().from(orders).where(eq(orders.restaurantId, restaurantId));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await this.db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await this.db.update(orders).set(order).where(eq(orders.id, id)).returning();
    return updated;
  }

  // Drivers
  async getDrivers(): Promise<Driver[]> {
    return await this.db.select().from(drivers);
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await this.db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return await this.db.select().from(drivers).where(and(eq(drivers.isAvailable, true), eq(drivers.isActive, true)));
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const [newDriver] = await this.db.insert(drivers).values(driver).returning();
    return newDriver;
  }

  async updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined> {
    const [updated] = await this.db.update(drivers).set(driver).where(eq(drivers.id, id)).returning();
    return updated;
  }

  async deleteDriver(id: string): Promise<boolean> {
    const result = await this.db.delete(drivers).where(eq(drivers.id, id));
    return result.rowCount > 0;
  }

  // Special Offers
  async getSpecialOffers(): Promise<SpecialOffer[]> {
    return await this.db.select().from(specialOffers);
  }

  async getActiveSpecialOffers(): Promise<SpecialOffer[]> {
    return await this.db.select().from(specialOffers).where(eq(specialOffers.isActive, true));
  }

  async createSpecialOffer(offer: InsertSpecialOffer): Promise<SpecialOffer> {
    const [newOffer] = await this.db.insert(specialOffers).values(offer).returning();
    return newOffer;
  }

  async updateSpecialOffer(id: string, offer: Partial<InsertSpecialOffer>): Promise<SpecialOffer | undefined> {
    const [updated] = await this.db.update(specialOffers).set(offer).where(eq(specialOffers.id, id)).returning();
    return updated;
  }

  async deleteSpecialOffer(id: string): Promise<boolean> {
    const result = await this.db.delete(specialOffers).where(eq(specialOffers.id, id));
    return result.rowCount > 0;
  }

  // UI Settings
  async getUiSettings(): Promise<UiSettings[]> {
    return await this.db.select().from(uiSettings);
  }

  async getUiSetting(key: string): Promise<UiSettings | undefined> {
    const [setting] = await this.db.select().from(uiSettings).where(eq(uiSettings.key, key));
    return setting;
  }

  async updateUiSetting(key: string, value: string): Promise<UiSettings | undefined> {
    const [updated] = await this.db.update(uiSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(uiSettings.key, key))
      .returning();
    return updated;
  }

  async createUiSetting(setting: InsertUiSettings): Promise<UiSettings> {
    const [newSetting] = await this.db.insert(uiSettings).values(setting).returning();
    return newSetting;
  }

  async deleteUiSetting(key: string): Promise<boolean> {
    const result = await this.db.delete(uiSettings).where(eq(uiSettings.key, key));
    return result.rowCount > 0;
  }
  // ================= RESTAURANT SECTIONS =================
  async getRestaurantSections(restaurantId: string): Promise<RestaurantSection[]> {
    return this.db.select().from(restaurantSections)
      .where(eq(restaurantSections.restaurantId, restaurantId))
      .orderBy(restaurantSections.sortOrder);
  }

  async createRestaurantSection(section: InsertRestaurantSection): Promise<RestaurantSection> {
    const [newSection] = await this.db.insert(restaurantSections).values(section).returning();
    return newSection;
  }

  async updateRestaurantSection(id: string, updates: Partial<InsertRestaurantSection>): Promise<RestaurantSection | undefined> {
    const [updated] = await this.db.update(restaurantSections)
      .set(updates)
      .where(eq(restaurantSections.id, id))
      .returning();
    return updated;
  }

  async deleteRestaurantSection(id: string): Promise<boolean> {
    const result = await this.db.delete(restaurantSections).where(eq(restaurantSections.id, id));
    return result.rowCount > 0;
  }

  // ================= RATINGS & REVIEWS =================
  async getRatings(restaurantId?: string, approved?: boolean): Promise<Rating[]> {
    let query = this.db.select().from(ratings);
    
    const conditions = [];
    if (restaurantId) {
      conditions.push(eq(ratings.restaurantId, restaurantId));
    }
    if (approved !== undefined) {
      conditions.push(eq(ratings.isApproved, approved));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(ratings.createdAt));
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const [newRating] = await this.db.insert(ratings).values(rating).returning();
    return newRating;
  }

  async updateRating(id: string, updates: Partial<InsertRating>): Promise<Rating | undefined> {
    const [updated] = await this.db.update(ratings)
      .set(updates)
      .where(eq(ratings.id, id))
      .returning();
    return updated;
  }

  async deleteRating(id: string): Promise<boolean> {
    const result = await this.db.delete(ratings).where(eq(ratings.id, id));
    return result.rowCount > 0;
  }

  // ================= NOTIFICATIONS =================
  async getNotifications(recipientType?: string, recipientId?: string, unread?: boolean): Promise<Notification[]> {
    let query = this.db.select().from(notifications);
    
    const conditions = [];
    if (recipientType) {
      conditions.push(eq(notifications.recipientType, recipientType));
    }
    if (recipientId) {
      conditions.push(eq(notifications.recipientId, recipientId));
    }
    if (unread !== undefined) {
      conditions.push(eq(notifications.isRead, !unread));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await this.db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [updated] = await this.db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  // ================= WALLETS & PAYMENTS =================
  async getWallet(phone: string): Promise<Wallet | undefined> {
    const [wallet] = await this.db.select().from(wallets).where(eq(wallets.customerPhone, phone));
    return wallet;
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const [newWallet] = await this.db.insert(wallets).values(wallet).returning();
    return newWallet;
  }

  async createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const [newTransaction] = await this.db.insert(walletTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getWalletTransactions(phone: string): Promise<WalletTransaction[]> {
    return await this.db.select({
      id: walletTransactions.id,
      walletId: walletTransactions.walletId,
      type: walletTransactions.type,
      amount: walletTransactions.amount,
      description: walletTransactions.description,
      orderId: walletTransactions.orderId,
      createdAt: walletTransactions.createdAt
    })
    .from(walletTransactions)
    .innerJoin(wallets, eq(walletTransactions.walletId, wallets.id))
    .where(eq(wallets.customerPhone, phone))
    .orderBy(desc(walletTransactions.createdAt));
  }

  // ================= SYSTEM SETTINGS =================
  async getSystemSettings(category?: string): Promise<SystemSettings[]> {
    let query = this.db.select().from(systemSettings);
    
    if (category) {
      query = query.where(eq(systemSettings.category, category));
    }
    
    return await query.where(eq(systemSettings.isActive, true));
  }

  async updateSystemSetting(key: string, value: string): Promise<SystemSettings | undefined> {
    const [updated] = await this.db.update(systemSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(systemSettings.key, key))
      .returning();
    return updated;
  }

  // ================= RESTAURANT EARNINGS =================
  async getRestaurantEarnings(): Promise<RestaurantEarnings[]> {
    return this.db.select().from(restaurantEarnings).where(eq(restaurantEarnings.isActive, true));
  }

  async getRestaurantEarningsByRestaurant(restaurantId: string): Promise<RestaurantEarnings | undefined> {
    const [earnings] = await this.db.select().from(restaurantEarnings)
      .where(eq(restaurantEarnings.restaurantId, restaurantId));
    return earnings;
  }

  async createRestaurantEarnings(earnings: InsertRestaurantEarnings): Promise<RestaurantEarnings> {
    const [newEarnings] = await this.db.insert(restaurantEarnings).values(earnings).returning();
    return newEarnings;
  }

  async updateRestaurantEarnings(id: string, updates: Partial<InsertRestaurantEarnings>): Promise<RestaurantEarnings | undefined> {
    const [updated] = await this.db.update(restaurantEarnings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(restaurantEarnings.id, id))
      .returning();
    return updated;
  }

  // ================= ANALYTICS & REPORTS =================
  async getDashboardAnalytics(): Promise<any> {
    const totalOrders = await this.db.select().from(orders);
    const totalDrivers = await this.db.select().from(drivers);
    const totalRestaurants = await this.db.select().from(restaurants);
    const pendingOrders = await this.db.select().from(orders).where(eq(orders.status, 'pending'));
    
    return {
      totalOrders: totalOrders.length,
      totalDrivers: totalDrivers.length,
      totalRestaurants: totalRestaurants.length,
      pendingOrders: pendingOrders.length,
      todaySales: "0.00" // يمكن حسابها لاحقاً
    };
  }

  async getSalesReport(startDate: string, endDate: string, restaurantId?: string): Promise<any> {
    let query = this.db.select().from(orders);
    
    const conditions = [];
    if (startDate) {
      conditions.push(eq(orders.createdAt, new Date(startDate))); // يحتاج تعديل للمقارنة الصحيحة
    }
    if (restaurantId) {
      conditions.push(eq(orders.restaurantId, restaurantId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const reportOrders = await query;
    
    return {
      totalOrders: reportOrders.length,
      totalRevenue: reportOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0),
      orders: reportOrders
    };
  }

  async getDriverPerformance(startDate: string, endDate: string): Promise<any> {
    const driversList = await this.db.select().from(drivers);
    
    const performance = await Promise.all(driversList.map(async (driver) => {
      const driverOrders = await this.db.select().from(orders)
        .where(eq(orders.driverId, driver.id || ''));
      
      return {
        driverId: driver.id,
        driverName: driver.name,
        totalOrders: driverOrders.length,
        totalEarnings: parseFloat(driver.earnings),
        isAvailable: driver.isAvailable
      };
    }));
    
    return performance;
  }
}

export const dbStorage = new DatabaseStorage();