/*
  # إضافة حقل username لجدول admin_users

  1. تعديلات الجدول
    - إضافة حقل `username` إلى جدول `admin_users`
    - جعل الحقل فريد ومطلوب
    - تحديث البيانات الموجودة

  2. تحديث البيانات
    - تعيين username للمدير الافتراضي
    - التأكد من عدم تضارب البيانات
*/

-- إضافة حقل username إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'username'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN username text UNIQUE;
  END IF;
END $$;

-- تحديث المدير الافتراضي إذا كان موجوداً
UPDATE admin_users 
SET username = 'neondb_owner' 
WHERE email = 'aymenpro124@gmail.com' AND user_type = 'admin' AND username IS NULL;

-- إدراج المدير الافتراضي إذا لم يكن موجوداً
INSERT INTO admin_users (username, email, password, name, user_type, is_active)
SELECT 'neondb_owner', 'aymenpro124@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'مدير النظام', 'admin', true
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users WHERE username = 'neondb_owner' OR email = 'aymenpro124@gmail.com'
);

-- إدراج سائق تجريبي إذا لم يكن موجوداً
INSERT INTO admin_users (phone, password, name, user_type, is_active)
SELECT '+967771234567', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'سائق تجريبي', 'driver', true
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users WHERE phone = '+967771234567'
);