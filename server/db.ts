import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { 
  users, userAddresses, categories, restaurants, menuItems, orders, drivers, specialOffers,
  adminUsers, adminSessions, uiSettings, restaurantSections, userWallet, walletTransactions,
  orderRatings, notifications, driverSessions, orderTracking, restaurantEarnings, driverEarnings,
  paymentSettings, deliveryPricing, languages, contentManagement,
  type User, type InsertUser,
  type UserAddress, type InsertUserAddress,
  type Category, type InsertCategory,
  type Restaurant, type InsertRestaurant,
  type MenuItem, type InsertMenuItem,
  type Order, type InsertOrder,
  type Driver, type InsertDriver,
  type SpecialOffer, type InsertSpecialOffer,
  type AdminUser, type InsertAdminUser,
  type AdminSession, type InsertAdminSession,
  type UiSettings, type InsertUiSettings,
  type RestaurantSection, type InsertRestaurantSection,
  type UserWallet, type InsertUserWallet,
  type WalletTransaction, type InsertWalletTransaction,
  type OrderRating, type InsertOrderRating,
  type Notification, type InsertNotification,
  type DriverSession, type InsertDriverSession,
  type OrderTracking, type InsertOrderTracking,
  type RestaurantEarnings, type InsertRestaurantEarnings,
  type DriverEarnings, type InsertDriverEarnings,
  type PaymentSettings, type InsertPaymentSettings,
  type DeliveryPricing, type InsertDeliveryPricing,
  type Language, type InsertLanguage,
  type ContentManagement, type InsertContentManagement
} from "@shared/schema";
import { IStorage } from "./storage.ts";
import { eq, and } from "drizzle-orm";

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
  private get db() {
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

  // User Addresses Enhanced
  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    return await this.db.select().from(userAddresses).where(eq(userAddresses.userId, userId));
  }

  async createUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    // If this is set as default, remove default from other addresses
    if (address.isDefault) {
      await this.db.update(userAddresses)
        .set({ isDefault: false })
        .where(eq(userAddresses.userId, address.userId));
    }
    const [newAddress] = await this.db.insert(userAddresses).values(address).returning();
    return newAddress;
  }

  async updateUserAddress(id: string, address: Partial<InsertUserAddress>): Promise<UserAddress | undefined> {
    if (address.isDefault) {
      await this.db.update(userAddresses)
        .set({ isDefault: false })
        .where(eq(userAddresses.userId, address.userId as string));
    }
    const [updated] = await this.db.update(userAddresses).set(address).where(eq(userAddresses.id, id)).returning();
    return updated;
  }

  async deleteUserAddress(id: string): Promise<boolean> {
    const result = await this.db.delete(userAddresses).where(eq(userAddresses.id, id));
    return result.rowCount > 0;
  }

  async getDefaultUserAddress(userId: string): Promise<UserAddress | undefined> {
    const [address] = await this.db.select().from(userAddresses)
      .where(and(eq(userAddresses.userId, userId), eq(userAddresses.isDefault, true)));
    return address;
  }

  // Restaurant Sections
  async getRestaurantSections(restaurantId: string): Promise<RestaurantSection[]> {
    return await this.db.select().from(restaurantSections)
      .where(eq(restaurantSections.restaurantId, restaurantId));
  }

  async createRestaurantSection(section: InsertRestaurantSection): Promise<RestaurantSection> {
    const [newSection] = await this.db.insert(restaurantSections).values(section).returning();
    return newSection;
  }

  async updateRestaurantSection(id: string, section: Partial<InsertRestaurantSection>): Promise<RestaurantSection | undefined> {
    const [updated] = await this.db.update(restaurantSections).set(section).where(eq(restaurantSections.id, id)).returning();
    return updated;
  }

  async deleteRestaurantSection(id: string): Promise<boolean> {
    const result = await this.db.delete(restaurantSections).where(eq(restaurantSections.id, id));
    return result.rowCount > 0;
  }

  // User Wallet
  async getUserWallet(userId: string): Promise<UserWallet | undefined> {
    const [wallet] = await this.db.select().from(userWallet).where(eq(userWallet.userId, userId));
    return wallet;
  }

  async createUserWallet(wallet: InsertUserWallet): Promise<UserWallet> {
    const [newWallet] = await this.db.insert(userWallet).values(wallet).returning();
    return newWallet;
  }

  async updateWalletBalance(userId: string, amount: string, type: 'credit' | 'debit'): Promise<UserWallet | undefined> {
    const wallet = await this.getUserWallet(userId);
    if (!wallet) return undefined;

    const currentBalance = parseFloat(wallet.balance);
    const amountNum = parseFloat(amount);
    
    let newBalance: number;
    let totalEarnings = parseFloat(wallet.totalEarnings || '0');
    let totalSpent = parseFloat(wallet.totalSpent || '0');

    if (type === 'credit') {
      newBalance = currentBalance + amountNum;
      totalEarnings += amountNum;
    } else {
      newBalance = currentBalance - amountNum;
      totalSpent += amountNum;
    }

    const [updated] = await this.db.update(userWallet)
      .set({ 
        balance: newBalance.toString(),
        totalEarnings: totalEarnings.toString(),
        totalSpent: totalSpent.toString(),
        updatedAt: new Date()
      })
      .where(eq(userWallet.userId, userId))
      .returning();
    
    return updated;
  }

  // Wallet Transactions
  async createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const [newTransaction] = await this.db.insert(walletTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
    return await this.db.select().from(walletTransactions)
      .where(eq(walletTransactions.userId, userId));
  }

  // Order Ratings
  async createOrderRating(rating: InsertOrderRating): Promise<OrderRating> {
    const [newRating] = await this.db.insert(orderRatings).values(rating).returning();
    return newRating;
  }

  async getOrderRatings(restaurantId?: string): Promise<OrderRating[]> {
    if (restaurantId) {
      return await this.db.select().from(orderRatings)
        .where(eq(orderRatings.restaurantId, restaurantId));
    }
    return await this.db.select().from(orderRatings);
  }

  async getOrderRating(orderId: string): Promise<OrderRating | undefined> {
    const [rating] = await this.db.select().from(orderRatings)
      .where(eq(orderRatings.orderId, orderId));
    return rating;
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await this.db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await this.db.select().from(notifications)
      .where(eq(notifications.userId, userId));
  }

  async getDriverNotifications(driverId: string): Promise<Notification[]> {
    return await this.db.select().from(notifications)
      .where(eq(notifications.driverId, driverId));
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const result = await this.db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return result.rowCount > 0;
  }

  // Driver Sessions
  async createDriverSession(session: InsertDriverSession): Promise<DriverSession> {
    const [newSession] = await this.db.insert(driverSessions).values(session).returning();
    return newSession;
  }

  async getDriverSession(token: string): Promise<DriverSession | undefined> {
    const [session] = await this.db.select().from(driverSessions)
      .where(eq(driverSessions.token, token));
    return session;
  }

  async updateDriverLocation(driverId: string, latitude: string, longitude: string): Promise<boolean> {
    const result = await this.db.update(driverSessions)
      .set({ 
        currentLatitude: latitude,
        currentLongitude: longitude,
        lastActivity: new Date()
      })
      .where(eq(driverSessions.driverId, driverId));
    return result.rowCount > 0;
  }

  async setDriverOnlineStatus(driverId: string, isOnline: boolean): Promise<boolean> {
    const result = await this.db.update(driverSessions)
      .set({ isOnline, lastActivity: new Date() })
      .where(eq(driverSessions.driverId, driverId));
    return result.rowCount > 0;
  }

  // Order Tracking
  async createOrderTracking(tracking: InsertOrderTracking): Promise<OrderTracking> {
    const [newTracking] = await this.db.insert(orderTracking).values(tracking).returning();
    return newTracking;
  }

  async getOrderTracking(orderId: string): Promise<OrderTracking[]> {
    return await this.db.select().from(orderTracking)
      .where(eq(orderTracking.orderId, orderId));
  }

  // Restaurant Earnings
  async createRestaurantEarnings(earnings: InsertRestaurantEarnings): Promise<RestaurantEarnings> {
    const [newEarnings] = await this.db.insert(restaurantEarnings).values(earnings).returning();
    return newEarnings;
  }

  async getRestaurantEarnings(restaurantId: string): Promise<RestaurantEarnings[]> {
    return await this.db.select().from(restaurantEarnings)
      .where(eq(restaurantEarnings.restaurantId, restaurantId));
  }

  async updateRestaurantEarningsStatus(id: string, status: string, paidAt?: Date): Promise<RestaurantEarnings | undefined> {
    const updateData: Partial<InsertRestaurantEarnings> = { status };
    if (paidAt) updateData.paidAt = paidAt;
    
    const [updated] = await this.db.update(restaurantEarnings)
      .set(updateData)
      .where(eq(restaurantEarnings.id, id))
      .returning();
    return updated;
  }

  // Driver Earnings
  async createDriverEarnings(earnings: InsertDriverEarnings): Promise<DriverEarnings> {
    const [newEarnings] = await this.db.insert(driverEarnings).values(earnings).returning();
    return newEarnings;
  }

  async getDriverEarnings(driverId: string): Promise<DriverEarnings[]> {
    return await this.db.select().from(driverEarnings)
      .where(eq(driverEarnings.driverId, driverId));
  }

  async updateDriverEarningsStatus(id: string, status: string, paidAt?: Date): Promise<DriverEarnings | undefined> {
    const updateData: Partial<InsertDriverEarnings> = { status };
    if (paidAt) updateData.paidAt = paidAt;
    
    const [updated] = await this.db.update(driverEarnings)
      .set(updateData)
      .where(eq(driverEarnings.id, id))
      .returning();
    return updated;
  }

  // Payment Settings
  async getPaymentSettings(): Promise<PaymentSettings[]> {
    return await this.db.select().from(paymentSettings);
  }

  async createPaymentSetting(setting: InsertPaymentSettings): Promise<PaymentSettings> {
    const [newSetting] = await this.db.insert(paymentSettings).values(setting).returning();
    return newSetting;
  }

  async updatePaymentSetting(id: string, setting: Partial<InsertPaymentSettings>): Promise<PaymentSettings | undefined> {
    const [updated] = await this.db.update(paymentSettings)
      .set({ ...setting, updatedAt: new Date() })
      .where(eq(paymentSettings.id, id))
      .returning();
    return updated;
  }

  // Delivery Pricing
  async getDeliveryPricing(): Promise<DeliveryPricing[]> {
    return await this.db.select().from(deliveryPricing);
  }

  async createDeliveryPricing(pricing: InsertDeliveryPricing): Promise<DeliveryPricing> {
    const [newPricing] = await this.db.insert(deliveryPricing).values(pricing).returning();
    return newPricing;
  }

  async updateDeliveryPricing(id: string, pricing: Partial<InsertDeliveryPricing>): Promise<DeliveryPricing | undefined> {
    const [updated] = await this.db.update(deliveryPricing)
      .set(pricing)
      .where(eq(deliveryPricing.id, id))
      .returning();
    return updated;
  }

  // Languages
  async getLanguages(): Promise<Language[]> {
    return await this.db.select().from(languages);
  }

  async createLanguage(language: InsertLanguage): Promise<Language> {
    if (language.isDefault) {
      await this.db.update(languages).set({ isDefault: false });
    }
    const [newLanguage] = await this.db.insert(languages).values(language).returning();
    return newLanguage;
  }

  async updateLanguage(id: string, language: Partial<InsertLanguage>): Promise<Language | undefined> {
    if (language.isDefault) {
      await this.db.update(languages).set({ isDefault: false });
    }
    const [updated] = await this.db.update(languages)
      .set(language)
      .where(eq(languages.id, id))
      .returning();
    return updated;
  }

  // Content Management
  async getContentByLanguage(languageCode: string, category?: string): Promise<ContentManagement[]> {
    if (category) {
      return await this.db.select().from(contentManagement)
        .where(and(
          eq(contentManagement.languageCode, languageCode),
          eq(contentManagement.category, category)
        ));
    }
    
    return await this.db.select().from(contentManagement)
      .where(eq(contentManagement.languageCode, languageCode));
  }

  async createContent(content: InsertContentManagement): Promise<ContentManagement> {
    const [newContent] = await this.db.insert(contentManagement).values(content).returning();
    return newContent;
  }

  async updateContent(id: string, content: Partial<InsertContentManagement>): Promise<ContentManagement | undefined> {
    const [updated] = await this.db.update(contentManagement)
      .set({ ...content, updatedAt: new Date() })
      .where(eq(contentManagement.id, id))
      .returning();
    return updated;
  }
}

export const dbStorage = new DatabaseStorage();