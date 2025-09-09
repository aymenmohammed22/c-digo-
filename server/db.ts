import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { 
  adminUsers, adminSessions, categories, restaurantSections, restaurants, 
  menuItems, customers, customerAddresses, orders, specialOffers, 
  notifications, reviews, systemSettings, driverStats, orderTracking,
  type AdminUser, type InsertAdminUser,
  type AdminSession, type InsertAdminSession,
  type Category, type InsertCategory,
  type Restaurant, type InsertRestaurant,
  type RestaurantSection, type InsertRestaurantSection,
  type MenuItem, type InsertMenuItem,
  type Customer, type InsertCustomer,
  type CustomerAddress, type InsertCustomerAddress,
  type Order, type InsertOrder,
  type SpecialOffer, type InsertSpecialOffer,
  type Notification, type InsertNotification,
  type Review, type InsertReview,
  type SystemSettings, type InsertSystemSettings,
  type DriverStats, type InsertDriverStats,
  type OrderTracking, type InsertOrderTracking
} from "@shared/schema";
import { IStorage } from "./storage";
import { eq, and, desc, sql } from "drizzle-orm";

// Database connection
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be defined in environment variables");
    }
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle({ client: sql });
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
    return result.length > 0;
  }

  // Users (using customers table instead of users)
  async getUser(id: string): Promise<Customer | undefined> {
    const [user] = await this.db.select().from(customers).where(eq(customers.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<Customer | undefined> {
    const [user] = await this.db.select().from(customers).where(eq(customers.phone, username));
    return user;
  }

  async createUser(user: InsertCustomer): Promise<Customer> {
    const [newUser] = await this.db.insert(customers).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, userData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await this.db.update(customers).set(userData).where(eq(customers.id, id)).returning();
    return updated;
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
    return result.length > 0;
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
    return result.length > 0;
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
    return result.length > 0;
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

  // Drivers (using adminUsers with userType = 'driver')
  async getDrivers(): Promise<AdminUser[]> {
    return await this.db.select().from(adminUsers).where(eq(adminUsers.userType, 'driver'));
  }

  async getDriver(id: string): Promise<AdminUser | undefined> {
    const [driver] = await this.db.select().from(adminUsers).where(
      and(eq(adminUsers.id, id), eq(adminUsers.userType, 'driver'))
    );
    return driver;
  }

  async getAvailableDrivers(): Promise<AdminUser[]> {
    return await this.db.select().from(adminUsers).where(
      and(
        eq(adminUsers.userType, 'driver'),
        eq(adminUsers.isActive, true)
      )
    );
  }

  async createDriver(driver: InsertAdminUser): Promise<AdminUser> {
    const driverWithType = { ...driver, userType: 'driver' as const };
    const [newDriver] = await this.db.insert(adminUsers).values(driverWithType).returning();
    return newDriver;
  }

  async updateDriver(id: string, driver: Partial<InsertAdminUser>): Promise<AdminUser | undefined> {
    const [updated] = await this.db.update(adminUsers).set(driver).where(
      and(eq(adminUsers.id, id), eq(adminUsers.userType, 'driver'))
    ).returning();
    return updated;
  }

  async deleteDriver(id: string): Promise<boolean> {
    const result = await this.db.delete(adminUsers).where(
      and(eq(adminUsers.id, id), eq(adminUsers.userType, 'driver'))
    );
    return result.length > 0;
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
    return result.length > 0;
  }

  // UI Settings (using systemSettings)
  async getUiSettings(): Promise<SystemSettings[]> {
    return await this.db.select().from(systemSettings).where(eq(systemSettings.isPublic, true));
  }

  async getUiSetting(key: string): Promise<SystemSettings | undefined> {
    const [setting] = await this.db.select().from(systemSettings).where(
      and(eq(systemSettings.key, key), eq(systemSettings.isPublic, true))
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
    return result.length > 0;
  }

  // Notifications
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
}

export const dbStorage = new DatabaseStorage();