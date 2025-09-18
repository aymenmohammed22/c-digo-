import { dbStorage } from './db';

export async function seedDefaultData() {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if data already exists to avoid duplicates
    const existingCategories = await dbStorage.getCategories();
    if (existingCategories.length > 0) {
      console.log('✓ Database already seeded, skipping...');
      return;
    }

    // Seed categories
    const categories = [
      { name: "مطاعم", icon: "fas fa-utensils", isActive: true, sortOrder: 0 },
      { name: "مقاهي", icon: "fas fa-coffee", isActive: true, sortOrder: 1 },
      { name: "حلويات", icon: "fas fa-candy-cane", isActive: true, sortOrder: 2 },
      { name: "سوبرماركت", icon: "fas fa-shopping-cart", isActive: true, sortOrder: 3 },
      { name: "صيدليات", icon: "fas fa-pills", isActive: true, sortOrder: 4 },
    ];

    console.log('📂 Seeding categories...');
    const seededCategories = [];
    for (const categoryData of categories) {
      const category = await dbStorage.createCategory(categoryData);
      seededCategories.push(category);
      console.log(`  ✓ Created category: ${category.name}`);
    }

    // Seed restaurants
    const restaurants = [
      {
        name: "مطعم الوزيكو للعربكة",
        description: "مطعم يمني تقليدي متخصص في الأطباق الشعبية",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.8",
        reviewCount: 4891,
        deliveryTime: "40-60 دقيقة",
        isOpen: true,
        minimumOrder: "25",
        deliveryFee: "5",
        categoryId: seededCategories[0].id,
        openingTime: "08:00",
        closingTime: "23:00",
        workingDays: "0,1,2,3,4,5,6",
        isTemporarilyClosed: false,
        address: "صنعاء، اليمن",
        isFeatured: true,
        isNew: false,
        isActive: true,
      },
      {
        name: "حلويات الشام",
        description: "أفضل الحلويات الشامية والعربية",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.6",
        reviewCount: 2341,
        deliveryTime: "30-45 دقيقة",
        isOpen: true,
        minimumOrder: "15",
        deliveryFee: "3",
        categoryId: seededCategories[2].id, // حلويات
        openingTime: "08:00",
        closingTime: "23:00",
        workingDays: "0,1,2,3,4,5,6",
        isTemporarilyClosed: false,
        address: "صنعاء، اليمن",
        isFeatured: false,
        isNew: true,
        isActive: true,
      },
      {
        name: "مقهى العروبة",
        description: "مقهى شعبي بالطابع العربي الأصيل",
        image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: "4.5",
        reviewCount: 1876,
        deliveryTime: "يفتح في 8:00 ص",
        isOpen: true,
        minimumOrder: "20",
        deliveryFee: "4",
        categoryId: seededCategories[1].id, // مقاهي
        openingTime: "08:00",
        closingTime: "23:00",
        workingDays: "0,1,2,3,4,5,6",
        isTemporarilyClosed: false,
        address: "صنعاء، اليمن",
        isFeatured: false,
        isNew: false,
        isActive: true,
      }
    ];

    console.log('🏪 Seeding restaurants...');
    const seededRestaurants = [];
    for (const restaurantData of restaurants) {
      const restaurant = await dbStorage.createRestaurant(restaurantData);
      seededRestaurants.push(restaurant);
      console.log(`  ✓ Created restaurant: ${restaurant.name}`);
    }

    // Seed menu items
    const menuItems = [
      {
        name: "عربكة بالقشطة والعسل",
        description: "حلوى يمنية تقليدية بالقشطة الطازجة والعسل الطبيعي",
        price: "55",
        image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        category: "وجبات رمضان",
        isAvailable: true,
        isSpecialOffer: false,
        restaurantId: seededRestaurants[0].id,
      },
      {
        name: "معصوب بالقشطة والعسل",
        description: "طبق يمني شعبي بالموز والقشطة والعسل",
        price: "55",
        image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        category: "وجبات رمضان",
        isAvailable: true,
        isSpecialOffer: false,
        restaurantId: seededRestaurants[0].id,
      },
      {
        name: "كنافة نابلسية",
        description: "كنافة نابلسية بالجبنة والقطر",
        price: "45",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        category: "حلويات شرقية",
        isAvailable: true,
        isSpecialOffer: true,
        originalPrice: "50",
        restaurantId: seededRestaurants[1].id,
      },
      {
        name: "بقلاوة بالفستق",
        description: "بقلاوة محشية بالفستق الحلبي",
        price: "35",
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        category: "حلويات شرقية",
        isAvailable: true,
        isSpecialOffer: false,
        restaurantId: seededRestaurants[1].id,
      }
    ];

    console.log('🍽️ Seeding menu items...');
    for (const menuItemData of menuItems) {
      const menuItem = await dbStorage.createMenuItem(menuItemData);
      console.log(`  ✓ Created menu item: ${menuItem.name}`);
    }

    // Seed UI Settings
    const uiSettings = [
      {
        key: "delivery_fee_default",
        value: "5",
        category: "delivery",
        description: "رسوم التوصيل الافتراضية"
      },
      {
        key: "minimum_order_default",
        value: "20",
        category: "orders",
        description: "الحد الأدنى للطلب"
      },
      {
        key: "app_name",
        value: "السريع للطلبات",
        category: "general",
        description: "اسم التطبيق"
      },
      {
        key: "app_theme",
        value: "light",
        category: "appearance",
        description: "ثيم التطبيق"
      }
    ];

    console.log('⚙️ Seeding UI settings...');
    for (const settingData of uiSettings) {
      const setting = await dbStorage.createUiSetting(settingData);
      console.log(`  ✓ Created UI setting: ${setting.key}`);
    }

    // Create default admin user
    const adminUser = {
      name: "مدير النظام",
      email: "admin@alsarie.com",
      username: "admin",
      phone: "+967777777777",
      userType: "admin",
      isActive: true,
    };

    console.log('👤 Seeding admin user...');
    const createdAdmin = await dbStorage.createAdminUser(adminUser);
    console.log(`  ✓ Created admin user: ${createdAdmin.name}`);

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Seeded: ${categories.length} categories, ${restaurants.length} restaurants, ${menuItems.length} menu items, ${uiSettings.length} UI settings, 1 admin user`);

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}