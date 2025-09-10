import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { 
  adminUsers, adminSessions, categories, restaurantSections, restaurants, 
  menuItems, users, userAddresses, orders, specialOffers, 
  notifications, ratings, systemSettingsTable as systemSettings, drivers, orderTracking,
  type AdminUser, type InsertAdminUser,
  type AdminSession, type InsertAdminSession,
  type Category, type InsertCategory,
  type Restaurant, type InsertRestaurant,
  type RestaurantSection, type InsertRestaurantSection,
  type MenuItem, type InsertMenuItem,
  type User, type InsertUser,
  type UserAddress, type InsertUserAddress,
  type Order, type InsertOrder,
  type SpecialOffer, type InsertSpecialOffer,
  type Notification, type InsertNotification,
  type Rating, type InsertRating,
  type SystemSettings, type InsertSystemSettings,
  type Driver, type InsertDriver
} from "@shared/schema";
import { IStorage } from "./storage";
import { eq, and, desc, sql, or, like } from "drizzle-orm";

// Database connection
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be defined in environment variables");
    }
    
    // Configure for Replit environment to handle SSL issues
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const sqlClient = neon(process.env.DATABASE_URL);
    db = drizzle(sqlClient);
  }
  return db;
}

// ... rest of the DatabaseStorage class remains the same

export class DatabaseStorage implements IStorage {
  get db() {
    return getDb();
  }

  // Admin Authentication
  async createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser> {
    const [newAdmin] = await this.db.insert(adminUsers).values(adminUser).returning();
    return newAdmin;
  }

  async getAdminByEmail(emailOrUsername: string): Promise<AdminUser | undefined> {
    const result = await this.db.select().from(adminUsers).where(
      or(
        eq(adminUsers.email, emailOrUsername),
        eq(adminUsers.username, emailOrUsername)
      )
    );
    return result[0];
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

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await this.db.update(users).set(userData).where(eq(users.id, id)).returning();
    return updated;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const result = await this.db.select().from(categories);
      return result || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
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
    try {
      const result = await this.db.select().from(restaurants);
      return result || [];
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      return [];
    }
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
    return await this.db.select().from(drivers).where(
      and(
        eq(drivers.isAvailable, true),
        eq(drivers.isActive, true)
      )
    );
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

  // Search methods
  async searchRestaurants(searchTerm: string): Promise<Restaurant[]> {
    return await this.db.select().from(restaurants).where(
      and(
        eq(restaurants.isActive, true),
        or(
          like(restaurants.name, searchTerm),
          like(restaurants.description, searchTerm)
        )
      )
    );
  }

  async searchMenuItems(searchTerm: string): Promise<MenuItem[]> {
    return await this.db.select().from(menuItems).where(
      or(
        like(menuItems.name, searchTerm),
        like(menuItems.description, searchTerm)
      )
    );
  }

  async searchCategories(searchTerm: string): Promise<Category[]> {
    return await this.db.select().from(categories).where(
      like(categories.name, searchTerm)
    );
  }

  // UI Settings (using systemSettings)
  async getUiSettings(): Promise<SystemSettings[]> {
    try {
      const result = await this.db.select().from(systemSettings).where(eq(systemSettings.isActive, true));
      return result || [];
    } catch (error) {
      console.error('Error fetching UI settings:', error);
      return [];
    }
  }

  async getUiSetting(key: string): Promise<SystemSettings | undefined> {
    const [setting] = await this.db.select().from(systemSettings).where(
      and(eq(systemSettings.key, key), eq(systemSettings.isActive, true))
    );
    return setting;
  }

  async updateUiSetting(key: string, value: string): Promise<SystemSettings | undefined> {
    const [updated] = await this.db.update(systemSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(systemSettings.key, key))
      .returning();
    return updated;
  }

  async createUiSetting(setting: InsertSystemSettings): Promise<SystemSettings> {
    const [newSetting] = await this.db.insert(systemSettings).values(setting).returning();
    return newSetting;
  }

  async deleteUiSetting(key: string): Promise<boolean> {
    const result = await this.db.delete(systemSettings).where(eq(systemSettings.key, key));
    return result.rowCount > 0;
  }

  // Notifications
  async getNotifications(recipientType?: string, recipientId?: string, unread?: boolean): Promise<Notification[]> {
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
      return await this.db.select().from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt));
    }
    
    return await this.db.select().from(notifications)
      .orderBy(desc(notifications.createdAt));
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

  // Search Functions
  async searchRestaurants(searchTerm: string, categoryId?: string): Promise<Restaurant[]> {
    const conditions = [
      or(
        like(restaurants.name, searchTerm),
        like(restaurants.description, searchTerm)
      )
    ];
    
    if (categoryId) {
      conditions.push(eq(restaurants.categoryId, categoryId));
    }
    
    return await this.db.select().from(restaurants)
      .where(and(...conditions))
      .orderBy(restaurants.name);
  }

  async searchCategories(searchTerm: string): Promise<Category[]> {
    return await this.db.select().from(categories)
      .where(like(categories.name, searchTerm))
      .orderBy(categories.name);
  }

  async searchMenuItems(searchTerm: string): Promise<MenuItem[]> {
    return await this.db.select().from(menuItems)
      .where(
        or(
          like(menuItems.name, searchTerm),
          like(menuItems.description, searchTerm),
          like(menuItems.category, searchTerm)
        )
      )
      .orderBy(menuItems.name);
  }

  // Enhanced Restaurant Functions
  async getRestaurants(filters?: { categoryId?: string; area?: string; isOpen?: boolean }): Promise<Restaurant[]> {
    const conditions = [];
    
    if (filters?.categoryId) {
      conditions.push(eq(restaurants.categoryId, filters.categoryId));
    }
    
    if (filters?.isOpen !== undefined) {
      conditions.push(eq(restaurants.isOpen, filters.isOpen));
    }
    
    if (conditions.length > 0) {
      return await this.db.select().from(restaurants)
        .where(and(...conditions))
        .orderBy(restaurants.name);
    }
    
    return await this.db.select().from(restaurants).orderBy(restaurants.name);
  }

  // Order Functions
  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await this.db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getCustomerOrders(customerPhone: string): Promise<Order[]> {
    return await this.db.select().from(orders)
      .where(eq(orders.customerPhone, customerPhone))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | undefined> {
    const [updated] = await this.db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return updated;
  }

  // Order Tracking Functions
  async createOrderTracking(tracking: any): Promise<any> {
    const [newTracking] = await this.db.insert(orderTracking).values(tracking).returning();
    return newTracking;
  }

  async getOrderTracking(orderId: string): Promise<any[]> {
    return await this.db.select().from(orderTracking)
      .where(eq(orderTracking.orderId, orderId))
      .orderBy(desc(orderTracking.createdAt));
  }
}

export const dbStorage = new DatabaseStorage();