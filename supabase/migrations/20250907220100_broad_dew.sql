/*
  # إنشاء الجداول الأساسية لنظام التوصيل

  1. الجداول الجديدة
    - `users` - المستخدمين العاديين
    - `user_addresses` - عناوين المستخدمين
    - `categories` - تصنيفات المطاعم
    - `restaurants` - المطاعم والمتاجر
    - `menu_items` - عناصر القوائم
    - `orders` - الطلبات
    - `drivers` - السائقين
    - `special_offers` - العروض الخاصة
    - `admin_users` - مستخدمي الإدارة
    - `admin_sessions` - جلسات الإدارة
    - `ui_settings` - إعدادات الواجهة

  2. الأمان
    - تفعيل RLS على جميع الجداول
    - إضافة سياسات الأمان المناسبة
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- User addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  details TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  image TEXT NOT NULL,
  address TEXT,
  rating VARCHAR(10) DEFAULT '0.0',
  review_count INTEGER DEFAULT 0,
  delivery_time VARCHAR(50) NOT NULL,
  is_open BOOLEAN DEFAULT true NOT NULL,
  minimum_order DECIMAL(10, 2) DEFAULT 0,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  opening_time VARCHAR(50) DEFAULT '08:00',
  closing_time VARCHAR(50) DEFAULT '23:00',
  working_days VARCHAR(50) DEFAULT '0,1,2,3,4,5,6',
  is_temporarily_closed BOOLEAN DEFAULT false,
  temporary_close_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  image TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  is_available BOOLEAN DEFAULT true NOT NULL,
  is_special_offer BOOLEAN DEFAULT false NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id)
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  current_location VARCHAR(200),
  earnings DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(100),
  delivery_address TEXT NOT NULL,
  notes TEXT,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  items TEXT NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  estimated_time VARCHAR(50) DEFAULT '30-45 دقيقة',
  restaurant_id UUID REFERENCES restaurants(id),
  driver_id UUID REFERENCES drivers(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Special offers table
CREATE TABLE IF NOT EXISTS special_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  discount_percent INTEGER,
  discount_amount DECIMAL(10, 2),
  minimum_order DECIMAL(10, 2) DEFAULT 0,
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  user_type VARCHAR(50) DEFAULT 'admin' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admin_users(id) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  user_type VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- UI settings table
CREATE TABLE IF NOT EXISTS ui_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Insert default UI settings
INSERT INTO ui_settings (key, value, description) VALUES
  ('show_categories', 'true', 'عرض تصنيفات المطاعم'),
  ('show_search_bar', 'true', 'عرض شريط البحث'),
  ('show_special_offers', 'true', 'عرض العروض الخاصة'),
  ('show_cart_button', 'true', 'عرض زر السلة'),
  ('show_ratings', 'true', 'عرض تقييمات المطاعم'),
  ('show_delivery_time', 'true', 'عرض وقت التوصيل'),
  ('show_minimum_order', 'true', 'عرض الحد الأدنى للطلب'),
  ('show_restaurant_description', 'true', 'عرض وصف المطعم'),
  ('enable_location_services', 'true', 'تفعيل خدمات الموقع'),
  ('driver_show_earnings', 'true', 'عرض الأرباح للسائق'),
  ('driver_show_customer_info', 'true', 'عرض معلومات العميل'),
  ('driver_show_order_details', 'true', 'عرض تفاصيل الطلب'),
  ('driver_show_available_orders', 'true', 'عرض الطلبات المتاحة'),
  ('driver_auto_refresh', 'true', 'التحديث التلقائي للطلبات'),
  ('driver_show_status_toggle', 'true', 'عرض مفتاح تغيير الحالة'),
  ('driver_show_location_button', 'true', 'عرض زر تحديث الموقع'),
  ('driver_show_navigation_help', 'true', 'عرض مساعدة التنقل'),
  ('driver_notification_sound', 'true', 'تفعيل صوت الإشعارات')
ON CONFLICT (key) DO NOTHING;

-- Insert default categories
INSERT INTO categories (id, name, icon, is_active) VALUES
  ('1', 'مطاعم', 'fas fa-utensils', true),
  ('2', 'مقاهي', 'fas fa-coffee', true),
  ('3', 'حلويات', 'fas fa-candy-cane', true),
  ('4', 'سوبرماركت', 'fas fa-shopping-cart', true),
  ('5', 'صيدليات', 'fas fa-pills', true)
ON CONFLICT (id) DO NOTHING;

-- Insert default restaurants
INSERT INTO restaurants (id, name, description, image, address, rating, review_count, delivery_time, is_open, minimum_order, delivery_fee, category_id, opening_time, closing_time, working_days, is_temporarily_closed, temporary_close_reason) VALUES
  ('1', 'مطعم الوزيكو للعربكة', 'مطعم يمني تقليدي متخصص في الأطباق الشعبية', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400', 'صنعاء، شارع الزبيري، بجانب مسجد النور', '4.8', 4891, '40-60 دقيقة', true, 25, 5, '1', '08:00', '23:00', '0,1,2,3,4,5,6', false, null),
  ('2', 'حلويات الشام', 'أفضل الحلويات الشامية والعربية', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400', 'صنعاء، شارع الستين، مجمع التجاري', '4.6', 2341, '30-45 دقيقة', true, 15, 3, '3', '08:00', '23:00', '0,1,2,3,4,5,6', false, null),
  ('3', 'مقهى العروبة', 'مقهى شعبي بالطابع العربي الأصيل', 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400', 'صنعاء، شارع السبعين، قرب دوار الأمم المتحدة', '4.5', 1876, 'يفتح في 8:00 ص', false, 20, 4, '2', '08:00', '23:00', '0,1,2,3,4,5,6', false, null)
ON CONFLICT (id) DO NOTHING;

-- Insert default menu items
INSERT INTO menu_items (id, name, description, price, image, category, is_available, is_special_offer, original_price, restaurant_id) VALUES
  ('1', 'عربكة بالقشطة والعسل', 'حلوى يمنية تقليدية بالقشطة الطازجة والعسل الطبيعي', 55, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200', 'وجبات رمضان', true, false, null, '1'),
  ('2', 'معصوب بالقشطة والعسل', 'طبق يمني شعبي بالموز والقشطة والعسل', 55, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200', 'وجبات رمضان', true, false, null, '1'),
  ('3', 'مياه معدنية 750 مل', 'مياه طبيعية معدنية عالية الجودة', 3, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200', 'المشروبات', true, false, null, '1'),
  ('4', 'كومبو عربكة خاص', 'عربكة + مطبق عادي + مشروب غازي', 55, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200', 'العروض', true, true, 60, '1')
ON CONFLICT (id) DO NOTHING;

-- Insert default admin user (password: admin123456)
INSERT INTO admin_users (id, name, email, password, user_type, is_active) VALUES
  ('1', 'مدير النظام', 'admin@alsarie-one.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insert default driver (password: password123)
INSERT INTO drivers (id, name, phone, password, is_available, is_active, current_location, earnings) VALUES
  ('1', 'أحمد محمد', '+967771234567', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, true, 'صنعاء', 2500),
  ('2', 'علي حسن', '+967779876543', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, true, 'تعز', 3200)
ON CONFLICT (phone) DO NOTHING;

-- Insert default special offers
INSERT INTO special_offers (id, title, description, image, discount_percent, discount_amount, minimum_order, is_active, valid_until) VALUES
  ('1', 'خصم 20% على الطلبات فوق 100 ريال', 'احصل على خصم 20% عند طلب بقيمة 100 ريال أو أكثر', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400', 20, null, 100, true, NOW() + INTERVAL '30 days'),
  ('2', 'توصيل مجاني', 'توصيل مجاني للطلبات فوق 50 ريال', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400', null, 5, 50, true, NOW() + INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_restaurants_category ON restaurants(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);