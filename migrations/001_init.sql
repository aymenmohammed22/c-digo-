-- migrations/001_init.sql
-- تهيئة قاعدة البيانات لتطبيق السريع ون

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول عناوين المستخدمين
CREATE TABLE IF NOT EXISTS user_addresses (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR REFERENCES users(id),
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    address TEXT NOT NULL,
    details TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول التصنيفات
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- جدول المطاعم
CREATE TABLE IF NOT EXISTS restaurants (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image TEXT NOT NULL,
    rating TEXT DEFAULT '0.0',
    review_count INTEGER DEFAULT 0,
    delivery_time TEXT NOT NULL,
    is_open BOOLEAN DEFAULT true,
    minimum_order INTEGER DEFAULT 0,
    delivery_fee INTEGER DEFAULT 0,
    category_id VARCHAR REFERENCES categories(id),
    opening_time TEXT DEFAULT '08:00',
    closing_time TEXT DEFAULT '23:00',
    working_days TEXT DEFAULT '0,1,2,3,4,5,6',
    is_temporarily_closed BOOLEAN DEFAULT false,
    temporary_close_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول عناصر القائمة
CREATE TABLE IF NOT EXISTS menu_items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    image TEXT NOT NULL,
    category TEXT NOT NULL,
    is_available BOOLEAN DEFAULT true,
    is_special_offer BOOLEAN DEFAULT false,
    original_price INTEGER,
    restaurant_id VARCHAR REFERENCES restaurants(id)
);

-- جدول السائقين
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    current_location TEXT,
    earnings INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الطلبات
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    delivery_address TEXT NOT NULL,
    notes TEXT,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    items TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    delivery_fee INTEGER NOT NULL,
    total INTEGER NOT NULL,
    estimated_time TEXT DEFAULT '30-45 دقيقة',
    restaurant_id VARCHAR REFERENCES restaurants(id),
    driver_id VARCHAR REFERENCES drivers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول العروض الخاصة
CREATE TABLE IF NOT EXISTS special_offers (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    discount_percent INTEGER,
    discount_amount INTEGER,
    minimum_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول مستخدمي الأدمن
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- ← تم إضافة هذا الحقل
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    user_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- جدول جلسات الأدمن
CREATE TABLE IF NOT EXISTS admin_sessions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id VARCHAR REFERENCES admin_users(id),
    token TEXT NOT NULL UNIQUE,
    user_type TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_category_id ON restaurants(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);

-- إدراج بيانات أولية للتطوير والاختبار
-- إضافة مستخدم أدمن افتراضي (كلمة المرور: admin123)
INSERT INTO admin_users (name, email, password, usertype) 
VALUES ('مدير النظام', 'admin@alsarie-one.com', 'admin123456', 'admin')
ON CONFLICT (email) DO NOTHING;

-- إضافة تصنيفات افتراضية
INSERT INTO categories (name, icon) VALUES
('طعام سريع', '🍔'),
('مطاعم عربية', '🥘'),
('حلويات', '🧁'),
('مشروبات', '☕')
ON CONFLICT DO NOTHING;

-- إضافة مطاعم افتراضية
INSERT INTO restaurants (name, description, image, delivery_time, category_id) 
SELECT 
    'مطعم البرغر الذهبي',
    'أفضل برغر في المدينة',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
    '20-30 دقيقة',
    id
FROM categories WHERE name = 'طعام سريع'
ON CONFLICT DO NOTHING;

INSERT INTO restaurants (name, description, image, delivery_time, category_id) 
SELECT 
    'مطعم اليمن السعيد',
    'أشهى المأكولات اليمنية الأصيلة',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
    '45-60 دقيقة',
    id
FROM categories WHERE name = 'مطاعم عربية'
ON CONFLICT DO NOTHING;

-- إضافة عناصر قائمة افتراضية
INSERT INTO menu_items (name, description, price, image, category, restaurant_id)
SELECT 
    'برغر كلاسيك',
    'برغر لحم بقري مع الخضار الطازجة',
    2500,
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    'برغر',
    id
FROM restaurants WHERE name = 'مطعم البرغر الذهبي'
ON CONFLICT DO NOTHING;

INSERT INTO menu_items (name, description, price, image, category, restaurant_id)
SELECT 
    'مندي لحم',
    'أكلة يمنية أصيلة بطعم لا يقاوم',
    3500,
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
    'أطباق رئيسية',
    id
FROM restaurants WHERE name = 'مطعم اليمن السعيد'
ON CONFLICT DO NOTHING;

-- إضافة سائق افتراضي
INSERT INTO drivers (name, phone, password) 
VALUES ('أحمد محمد', '+967771234567', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (phone) DO NOTHING;

-- إضافة عروض خاصة
INSERT INTO special_offers (title, description, image, discount_percent, minimum_order, valid_until) 
VALUES (
    'خصم 20% على أول طلب',
    'احصل على خصم 20% على طلبك الأول من تطبيق السريع ون',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
    20,
    1000,
    CURRENT_TIMESTAMP + INTERVAL '30 days'
)
ON CONFLICT DO NOTHING;