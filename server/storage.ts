import { 
  type Category, type InsertCategory,
  type Restaurant, type InsertRestaurant,
  type MenuItem, type InsertMenuItem,
  type Order, type InsertOrder,
  type Driver, type InsertDriver,
  type SpecialOffer, type InsertSpecialOffer,
  type User, type InsertUser,
  type UiSettings, type InsertUiSettings
} from "./shared/schema.ts";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Restaurants
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  getRestaurantsByCategory(categoryId: string): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: string, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  deleteRestaurant(id: string): Promise<boolean>;

  // Menu Items
  getMenuItems(restaurantId: string): Promise<MenuItem[]>;
  getMenuItem(id: string): Promise<MenuItem | undefined>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: string, menuItem: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: string): Promise<boolean>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByRestaurant(restaurantId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;

  // Drivers
  getDrivers(): Promise<Driver[]>;
  getDriver(id: string): Promise<Driver | undefined>;
  getAvailableDrivers(): Promise<Driver[]>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined>;
  deleteDriver(id: string): Promise<boolean>;

  // Special Offers
  getSpecialOffers(): Promise<SpecialOffer[]>;
  getActiveSpecialOffers(): Promise<SpecialOffer[]>;
  createSpecialOffer(offer: InsertSpecialOffer): Promise<SpecialOffer>;
  updateSpecialOffer(id: string, offer: Partial<InsertSpecialOffer>): Promise<SpecialOffer | undefined>;
  deleteSpecialOffer(id: string): Promise<boolean>;

  // UI Settings
  getUiSettings?(): Promise<UiSettings[]>;
  getUiSetting?(key: string): Promise<UiSettings | undefined>;
  updateUiSetting?(key: string, value: string): Promise<UiSettings | undefined>;
  createUiSetting?(setting: InsertUiSettings): Promise<UiSettings>;
  deleteUiSetting?(key: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<string, Category>;
  private restaurants: Map<string, Restaurant>;
  private menuItems: Map<string, MenuItem>;
  private orders: Map<string, Order>;
  private drivers: Map<string, Driver>;
  private specialOffers: Map<string, SpecialOffer>;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.restaurants = new Map();
    this.menuItems = new Map();
    this.orders = new Map();
    this.drivers = new Map();
    this.specialOffers = new Map();
    
    this.initializeData();
  }

  private initializeData() {
    // Initialize categories
    const categories = [
      { id: "1", name: "مطاعم", icon: "fas fa-utensils", isActive: true },
      { id: "2", name: "مقاهي", icon: "fas fa-coffee", isActive: true },
      { id: "3", name: "حلويات", icon: "fas fa-candy-cane", isActive: true },
      { id: "4", name: "سوبرماركت", icon: "fas fa-shopping-cart", isActive: true },
      { id: "5", name: "صيدليات", icon: "fas fa-pills", isActive: true },
    ];

    categories.forEach(cat => this.categories.set(cat.id, cat));

    // Initialize restaurants
    const restaurants = [
      {
        id: "1",
        name: "مطعم الوزيكو للعربكة",
        description: "مطعم يمني تقليدي متخصص في الأطباق الشعبية",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 4891,
        deliveryTime: "40-60 دقيقة",
        isOpen: true,
        minimumOrder: 25,
        deliveryFee: 5,
        categoryId: "1",
        createdAt: new Date(),
      },
      {
        id: "2",
        name: "حلويات الشام",
        description: "أفضل الحلويات الشامية والعربية",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 2341,
        deliveryTime: "30-45 دقيقة",
        isOpen: true,
        minimumOrder: 15,
        deliveryFee: 3,
        categoryId: "3",
        createdAt: new Date(),
      },
      {
        id: "3",
        name: "مقهى العروبة",
        description: "مقهى شعبي بالطابع العربي الأصيل",
        image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 1876,
        deliveryTime: "يفتح في 8:00 ص",
        isOpen: false,
        minimumOrder: 20,
        deliveryFee: 4,
        categoryId: "2",
        createdAt: new Date(),
      }
    ];

    restaurants.forEach(restaurant => this.restaurants.set(restaurant.id, restaurant));

    // Initialize menu items
    const menuItems = [
      {
        id: "1",
        name: "عربكة بالقشطة والعسل",
        description: "حلوى يمنية تقليدية بالقشطة الطازجة والعسل الطبيعي",
        price: 55,
        image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        category: "وجبات رمضان",
        isAvailable: true,
        isSpecialOffer: false,
        restaurantId: "1",
      },
      {
        id: "2",
        name: "معصوب بالقشطة والعسل",
        description: "طبق يمني شعبي بالموز والقشطة والعسل",
        price: 55,
        image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        category: "وجبات رمضان",
        isAvailable: true,
        isSpecialOffer: false,
        originalPrice: null,
        restaurantId: "1",
      },
      {
        id: "3",
        name: "مياه معدنية 750 مل",
        description: "مياه طبيعية معدنية عالية الجودة",
        price: 3,
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        category: "المشروبات",
        isAvailable: true,
        isSpecialOffer: false,
        originalPrice: null,
        restaurantId: "1",
      },
      {
        id: "4",
        name: "كومبو عربكة خاص",
        description: "عربكة + مطبق عادي + مشروب غازي",
        price: 55,
        originalPrice: 60,
        image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        category: "العروض",
        isAvailable: true,
        isSpecialOffer: true,
        restaurantId: "1",
      }
    ];

    menuItems.forEach(item => this.menuItems.set(item.id, item));

    // Initialize drivers
    const drivers = [
      {
        id: "1",
        name: "أحمد محمد",
        phone: "+967771234567",
        password: "password123",
        isAvailable: true,
        isActive: true,
        currentLocation: "صنعاء",
        earnings: 2500,
        createdAt: new Date(),
      },
      {
        id: "2", 
        name: "علي حسن",
        phone: "+967779876543",
        password: "password123",
        isAvailable: true,
        isActive: true,
        currentLocation: "تعز",
        earnings: 3200,
        createdAt: new Date(),
      }
    ];

    drivers.forEach(driver => this.drivers.set(driver.id, driver));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      name: insertUser.username,
      phone: null,
      email: null,
      address: null,
      isActive: true,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const newCategory: Category = { 
      ...category, 
      id,
      isActive: category.isActive ?? true 
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...category };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Restaurants
  async getRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values());
  }

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }

  async getRestaurantsByCategory(categoryId: string): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values()).filter(r => r.categoryId === categoryId);
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const id = randomUUID();
    const newRestaurant: Restaurant = { 
      ...restaurant, 
      id, 
      createdAt: new Date(),
      description: restaurant.description ?? null,
      rating: restaurant.rating ?? "0.0",
      reviewCount: restaurant.reviewCount ?? 0,
      isOpen: restaurant.isOpen ?? true,
      minimumOrder: restaurant.minimumOrder ?? 0,
      deliveryFee: restaurant.deliveryFee ?? 0,
      categoryId: restaurant.categoryId ?? null
    };
    this.restaurants.set(id, newRestaurant);
    return newRestaurant;
  }

  async updateRestaurant(id: string, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const existing = this.restaurants.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...restaurant };
    this.restaurants.set(id, updated);
    return updated;
  }

  async deleteRestaurant(id: string): Promise<boolean> {
    return this.restaurants.delete(id);
  }

  // Menu Items
  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(item => item.restaurantId === restaurantId);
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem> {
    const id = randomUUID();
    const newMenuItem: MenuItem = { 
      ...menuItem, 
      id,
      description: menuItem.description ?? null,
      isAvailable: menuItem.isAvailable ?? true,
      isSpecialOffer: menuItem.isSpecialOffer ?? false,
      originalPrice: menuItem.originalPrice ?? null,
      restaurantId: menuItem.restaurantId ?? null
    };
    this.menuItems.set(id, newMenuItem);
    return newMenuItem;
  }

  async updateMenuItem(id: string, menuItem: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const existing = this.menuItems.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...menuItem };
    this.menuItems.set(id, updated);
    return updated;
  }

  async deleteMenuItem(id: string): Promise<boolean> {
    return this.menuItems.delete(id);
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.restaurantId === restaurantId);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const newOrder: Order = { 
      ...order, 
      id, 
      createdAt: new Date(),
      customerEmail: order.customerEmail ?? null,
      notes: order.notes ?? null,
      status: order.status ?? "pending",
      estimatedTime: order.estimatedTime ?? "30-45 دقيقة",
      restaurantId: order.restaurantId ?? null,
      driverId: order.driverId ?? null,
      updatedAt: new Date()
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...order };
    this.orders.set(id, updated);
    return updated;
  }

  // Drivers
  async getDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values()).filter(driver => driver.isAvailable && driver.isActive);
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const id = randomUUID();
    const newDriver: Driver = { 
      ...driver, 
      id, 
      createdAt: new Date(),
      isActive: driver.isActive ?? true,
      isAvailable: driver.isAvailable ?? true,
      currentLocation: driver.currentLocation ?? null,
      earnings: driver.earnings ?? 0
    };
    this.drivers.set(id, newDriver);
    return newDriver;
  }

  async updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined> {
    const existing = this.drivers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...driver };
    this.drivers.set(id, updated);
    return updated;
  }

  async deleteDriver(id: string): Promise<boolean> {
    return this.drivers.delete(id);
  }

  // Special Offers
  async getSpecialOffers(): Promise<SpecialOffer[]> {
    return Array.from(this.specialOffers.values());
  }

  async getActiveSpecialOffers(): Promise<SpecialOffer[]> {
    return Array.from(this.specialOffers.values()).filter(offer => offer.isActive);
  }

  async createSpecialOffer(offer: InsertSpecialOffer): Promise<SpecialOffer> {
    const id = randomUUID();
    const newOffer: SpecialOffer = { 
      ...offer, 
      id, 
      createdAt: new Date(),
      isActive: offer.isActive ?? true,
      minimumOrder: offer.minimumOrder ?? 0,
      discountPercent: offer.discountPercent ?? null,
      discountAmount: offer.discountAmount ?? null,
      validUntil: offer.validUntil ?? null
    };
    this.specialOffers.set(id, newOffer);
    return newOffer;
  }

  async updateSpecialOffer(id: string, offer: Partial<InsertSpecialOffer>): Promise<SpecialOffer | undefined> {
    const existing = this.specialOffers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...offer };
    this.specialOffers.set(id, updated);
    return updated;
  }

  async deleteSpecialOffer(id: string): Promise<boolean> {
    return this.specialOffers.delete(id);
  }
}

export const storage = new MemStorage();
