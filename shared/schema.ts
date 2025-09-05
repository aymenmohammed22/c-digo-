import { pgTable, text, uuid, timestamp, boolean, integer, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(), // تمت الإضافة
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User addresses table
export const userAddresses = pgTable("user_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // تمت الإضافة: home, work, other
  title: varchar("title", { length: 100 }).notNull(),
  address: text("address").notNull(),
  details: text("details"), // تمت الإضافة
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 100 }).notNull(), // تم تغيير إلى notNull
  isActive: boolean("is_active").default(true).notNull(),
});

// Restaurants table
export const restaurants = pgTable("restaurants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  image: text("image").notNull(), // تم تغيير إلى notNull
  rating: varchar("rating", { length: 10 }).default("0.0"),
  reviewCount: integer("review_count").default(0),
  deliveryTime: varchar("delivery_time", { length: 50 }).notNull(), // تم تغيير إلى notNull
  isOpen: boolean("is_open").default(true).notNull(),
  minimumOrder: decimal("minimum_order", { precision: 10, scale: 2 }).default("0"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  categoryId: uuid("category_id").references(() => categories.id),
  openingTime: varchar("opening_time", { length: 50 }).default("08:00"), // تمت الإضافة
  closingTime: varchar("closing_time", { length: 50 }).default("23:00"), // تمت الإضافة
  workingDays: varchar("working_days", { length: 50 }).default("0,1,2,3,4,5,6"), // تمت الإضافة
  isTemporarilyClosed: boolean("is_temporarily_closed").default(false), // تمت الإضافة
  temporaryCloseReason: text("temporary_close_reason"), // تمت الإضافة
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Menu items table
export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  image: text("image").notNull(), // تم تغيير إلى notNull
  category: varchar("category", { length: 100 }).notNull(), // تم تغيير إلى notNull
  isAvailable: boolean("is_available").default(true).notNull(),
  isSpecialOffer: boolean("is_special_offer").default(false).notNull(),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id),
});

// Drivers table
export const drivers = pgTable("drivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  password: text("password").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  currentLocation: varchar("current_location", { length: 200 }),
  earnings: decimal("earnings", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerEmail: varchar("customer_email", { length: 100 }),
  deliveryAddress: text("delivery_address").notNull(),
  notes: text("notes"),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // تمت الإضافة
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  items: text("items").notNull(), // JSON string
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), // تمت الإضافة
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  estimatedTime: varchar("estimated_time", { length: 50 }).default("30-45 دقيقة"),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id),
  driverId: uuid("driver_id").references(() => drivers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Special offers table
export const specialOffers = pgTable("special_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(), // تم تغيير إلى notNull
  image: text("image").notNull(), // تمت الإضافة
  discountPercent: integer("discount_percent"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  minimumOrder: decimal("minimum_order", { precision: 10, scale: 2 }).default("0"),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  userType: varchar("user_type", { length: 50 }).default("admin").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin sessions table
export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id").references(() => adminUsers.id).notNull(),
  token: text("token").notNull().unique(),
  userType: varchar("user_type", { length: 50 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Restaurant sections table (أقسام المطاعم الفرعية)
export const restaurantSections = pgTable("restaurant_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User addresses table (enhanced for locations)
export const userWallet = pgTable("user_wallet", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wallet transactions table
export const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id").references(() => userWallet.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // credit, debit, refund
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  referenceId: varchar("reference_id", { length: 255 }), // order ID, etc.
  status: varchar("status", { length: 50 }).default("completed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Order ratings and reviews table
export const orderRatings = pgTable("order_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id).notNull(),
  driverId: uuid("driver_id").references(() => drivers.id),
  foodRating: integer("food_rating").notNull(), // 1-5
  serviceRating: integer("service_rating").notNull(), // 1-5
  deliveryRating: integer("delivery_rating"), // 1-5
  comment: text("comment"),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  driverId: uuid("driver_id").references(() => drivers.id),
  adminId: uuid("admin_id").references(() => adminUsers.id),
  type: varchar("type", { length: 50 }).notNull(), // order_update, promotion, system
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON for additional data
  isRead: boolean("is_read").default(false).notNull(),
  isDelivered: boolean("is_delivered").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Driver sessions table for tracking
export const driverSessions = pgTable("driver_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: uuid("driver_id").references(() => drivers.id).notNull(),
  token: text("token").notNull().unique(),
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 8 }),
  currentLongitude: decimal("current_longitude", { precision: 11, scale: 8 }),
  isOnline: boolean("is_online").default(false).notNull(),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Order tracking table
export const orderTracking = pgTable("order_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  driverId: uuid("driver_id").references(() => drivers.id),
  status: varchar("status", { length: 50 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  estimatedTime: varchar("estimated_time", { length: 50 }),
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Restaurant earnings table
export const restaurantEarnings = pgTable("restaurant_earnings", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id).notNull(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 10, scale: 2 }).default("0"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, paid, cancelled
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Driver earnings table
export const driverEarnings = pgTable("driver_earnings", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: uuid("driver_id").references(() => drivers.id).notNull(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 10, scale: 2 }).default("0"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment settings table
export const paymentSettings = pgTable("payment_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  method: varchar("method", { length: 50 }).notNull().unique(), // cash, card, wallet, bank
  isEnabled: boolean("is_enabled").default(true).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  settings: text("settings"), // JSON for method-specific settings
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Delivery pricing table
export const deliveryPricing = pgTable("delivery_pricing", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // distance, zone, fixed
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  pricePerKm: decimal("price_per_km", { precision: 10, scale: 2 }),
  minimumOrder: decimal("minimum_order", { precision: 10, scale: 2 }).default("0"),
  maximumDistance: decimal("maximum_distance", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Languages table
export const languages = pgTable("languages", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 10 }).notNull().unique(), // ar, en, etc.
  name: varchar("name", { length: 100 }).notNull(),
  nativeName: varchar("native_name", { length: 100 }).notNull(),
  direction: varchar("direction", { length: 10 }).default("ltr").notNull(), // ltr, rtl
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Content management table
export const contentManagement = pgTable("content_management", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull(),
  languageCode: varchar("language_code", { length: 10 }).references(() => languages.code).notNull(),
  content: text("content").notNull(),
  contentType: varchar("content_type", { length: 50 }).default("text").notNull(), // text, html, json
  category: varchar("category", { length: 50 }).notNull(), // terms, privacy, about, etc.
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// UI settings table
export const uiSettings = pgTable("ui_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).default("general"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertUserAddressSchema = createInsertSchema(userAddresses);
export const selectUserAddressSchema = createSelectSchema(userAddresses);
export type UserAddress = z.infer<typeof selectUserAddressSchema>;
export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;

export const insertCategorySchema = createInsertSchema(categories);
export const selectCategorySchema = createSelectSchema(categories);
export type Category = z.infer<typeof selectCategorySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export const insertRestaurantSchema = createInsertSchema(restaurants);
export const selectRestaurantSchema = createSelectSchema(restaurants);
export type Restaurant = z.infer<typeof selectRestaurantSchema>;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export const insertMenuItemSchema = createInsertSchema(menuItems);
export const selectMenuItemSchema = createSelectSchema(menuItems);
export type MenuItem = z.infer<typeof selectMenuItemSchema>;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);
export type Order = z.infer<typeof selectOrderSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export const insertDriverSchema = createInsertSchema(drivers);
export const selectDriverSchema = createSelectSchema(drivers);
export type Driver = z.infer<typeof selectDriverSchema>;
export type InsertDriver = z.infer<typeof insertDriverSchema>;

export const insertSpecialOfferSchema = createInsertSchema(specialOffers);
export const selectSpecialOfferSchema = createSelectSchema(specialOffers);
export type SpecialOffer = z.infer<typeof selectSpecialOfferSchema>;
export type InsertSpecialOffer = z.infer<typeof insertSpecialOfferSchema>;

export const insertAdminUserSchema = createInsertSchema(adminUsers);
export const selectAdminUserSchema = createSelectSchema(adminUsers);
export type AdminUser = z.infer<typeof selectAdminUserSchema>;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export const insertAdminSessionSchema = createInsertSchema(adminSessions);
export const selectAdminSessionSchema = createSelectSchema(adminSessions);
export type AdminSession = z.infer<typeof selectAdminSessionSchema>;
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;

export const insertUiSettingsSchema = createInsertSchema(uiSettings);
export const selectUiSettingsSchema = createSelectSchema(uiSettings);
export type UiSettings = z.infer<typeof selectUiSettingsSchema>;
export type InsertUiSettings = z.infer<typeof insertUiSettingsSchema>;

// Restaurant sections schemas
export const insertRestaurantSectionSchema = createInsertSchema(restaurantSections);
export const selectRestaurantSectionSchema = createSelectSchema(restaurantSections);
export type RestaurantSection = z.infer<typeof selectRestaurantSectionSchema>;
export type InsertRestaurantSection = z.infer<typeof insertRestaurantSectionSchema>;

// User wallet schemas  
export const insertUserWalletSchema = createInsertSchema(userWallet);
export const selectUserWalletSchema = createSelectSchema(userWallet);
export type UserWallet = z.infer<typeof selectUserWalletSchema>;
export type InsertUserWallet = z.infer<typeof insertUserWalletSchema>;

// Wallet transactions schemas
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions);
export const selectWalletTransactionSchema = createSelectSchema(walletTransactions);
export type WalletTransaction = z.infer<typeof selectWalletTransactionSchema>;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;

// Order ratings schemas
export const insertOrderRatingSchema = createInsertSchema(orderRatings);
export const selectOrderRatingSchema = createSelectSchema(orderRatings);
export type OrderRating = z.infer<typeof selectOrderRatingSchema>;
export type InsertOrderRating = z.infer<typeof insertOrderRatingSchema>;

// Notifications schemas
export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);
export type Notification = z.infer<typeof selectNotificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Driver sessions schemas
export const insertDriverSessionSchema = createInsertSchema(driverSessions);
export const selectDriverSessionSchema = createSelectSchema(driverSessions);
export type DriverSession = z.infer<typeof selectDriverSessionSchema>;
export type InsertDriverSession = z.infer<typeof insertDriverSessionSchema>;

// Order tracking schemas
export const insertOrderTrackingSchema = createInsertSchema(orderTracking);
export const selectOrderTrackingSchema = createSelectSchema(orderTracking);
export type OrderTracking = z.infer<typeof selectOrderTrackingSchema>;
export type InsertOrderTracking = z.infer<typeof insertOrderTrackingSchema>;

// Restaurant earnings schemas
export const insertRestaurantEarningsSchema = createInsertSchema(restaurantEarnings);
export const selectRestaurantEarningsSchema = createSelectSchema(restaurantEarnings);
export type RestaurantEarnings = z.infer<typeof selectRestaurantEarningsSchema>;
export type InsertRestaurantEarnings = z.infer<typeof insertRestaurantEarningsSchema>;

// Driver earnings schemas
export const insertDriverEarningsSchema = createInsertSchema(driverEarnings);
export const selectDriverEarningsSchema = createSelectSchema(driverEarnings);
export type DriverEarnings = z.infer<typeof selectDriverEarningsSchema>;
export type InsertDriverEarnings = z.infer<typeof insertDriverEarningsSchema>;

// Payment settings schemas
export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings);
export const selectPaymentSettingsSchema = createSelectSchema(paymentSettings);
export type PaymentSettings = z.infer<typeof selectPaymentSettingsSchema>;
export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;

// Delivery pricing schemas
export const insertDeliveryPricingSchema = createInsertSchema(deliveryPricing);
export const selectDeliveryPricingSchema = createSelectSchema(deliveryPricing);
export type DeliveryPricing = z.infer<typeof selectDeliveryPricingSchema>;
export type InsertDeliveryPricing = z.infer<typeof insertDeliveryPricingSchema>;

// Languages schemas
export const insertLanguageSchema = createInsertSchema(languages);
export const selectLanguageSchema = createSelectSchema(languages);
export type Language = z.infer<typeof selectLanguageSchema>;
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;

// Content management schemas
export const insertContentManagementSchema = createInsertSchema(contentManagement);
export const selectContentManagementSchema = createSelectSchema(contentManagement);
export type ContentManagement = z.infer<typeof selectContentManagementSchema>;
export type InsertContentManagement = z.infer<typeof insertContentManagementSchema>;