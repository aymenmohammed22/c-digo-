# دليل إعداد Supabase لتخزين الصور
## Supabase Integration Setup Guide

هذا الدليل يشرح كيفية ربط المشروع بقاعدة بيانات Supabase وإعداد تخزين الصور للوحة التحكم الإدارية.

## 📋 المتطلبات الأساسية

### 1. إنشاء مشروع Supabase جديد
1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. قم بإنشاء مشروع جديد أو استخدم المشروع الموجود
3. انتظر حتى يتم إنشاء المشروع بالكامل

### 2. الحصول على بيانات الاتصال
1. في صفحة المشروع، انقر على "Connect" في شريط الأدوات العلوي
2. انسخ قيمة URI تحت "Connection string" → "Transaction pooler"
3. استبدل `[YOUR-PASSWORD]` بكلمة مرور قاعدة البيانات التي حددتها

### 3. الحصول على مفاتيح API
1. اذهب إلى "Settings" → "API"
2. انسخ القيم التالية:
   - `Project URL` (SUPABASE_URL)
   - `anon/public` key (SUPABASE_ANON_KEY)
   - `service_role/secret` key (SUPABASE_SERVICE_ROLE_KEY)

## 🔧 إعداد متغيرات البيئة

يجب إضافة المتغيرات التالية في Replit Secrets:

```env
# قاعدة البيانات الأساسية (موجودة مسبقاً)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ruozmtobogmwprpnpjmj.supabase.co:5432/postgres

# متغيرات Supabase Storage
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### إضافة Secrets في Replit:
1. انقر على قفل الأمان 🔒 في الشريط الجانبي
2. انقر "Add Secret"
3. أضف كل متغير على حدة:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 🗄️ إعداد Storage Bucket

### 1. إنشاء Bucket للصور
1. اذهب إلى "Storage" في Supabase Dashboard
2. انقر "Create Bucket"
3. اسم الـ Bucket: `restaurant-images`
4. فعل "Public bucket" إذا كنت تريد الصور متاحة للجمهور

### 2. إعداد Storage Policies (RLS)
قم بتنفيذ الكود التالي في SQL Editor:

```sql
-- السماح برفع الصور (Public Upload Policy)
INSERT INTO storage.policies (id, bucket_id, name, definition, check)
VALUES (
  'allow-public-uploads',
  'restaurant-images',
  'Allow public uploads',
  'true',
  'true'
);

-- السماح بالوصول للصور (Public Access Policy)
INSERT INTO storage.policies (id, bucket_id, name, definition, check)
VALUES (
  'allow-public-access',
  'restaurant-images', 
  'Allow public access',
  'true',
  'true'
);
```

### 3. إعدادات إضافية للـ Bucket
```sql
-- تحديث إعدادات الـ Bucket لتكون عامة
UPDATE storage.buckets 
SET public = true 
WHERE id = 'restaurant-images';
```

## 🏗️ هيكل النظام المُحدث

### الملفات المُضافة والمُحدثة:

#### 1. Backend Files:
- **`server/supabase.ts`** - إعداد عميل Supabase
- **`server/routes/upload.ts`** - مسارات رفع الصور
- **`server/routes.ts`** - تحديث لإضافة مسارات الرفع

#### 2. Frontend Components:
- **`client/src/components/ImageUpload.tsx`** - مكون رفع الصور
- **`client/src/pages/AdminRestaurants.tsx`** - تحديث نموذج المطاعم
- **`client/src/pages/AdminMenuItems.tsx`** - تحديث نموذج الوجبات

#### 3. Dependencies المُضافة:
```json
{
  "@supabase/supabase-js": "^2.x.x",
  "multer": "^1.x.x",
  "base64-arraybuffer": "^2.x.x",
  "@types/multer": "^1.x.x"
}
```

## 🚀 كيفية الاستخدام

### 1. في لوحة التحكم الإدارية:
1. اذهب إلى "إدارة المطاعم" أو "إدارة الوجبات"
2. أنقر "إضافة جديد" أو "تعديل"
3. في قسم الصورة، انقر على منطقة الرفع
4. اختر صورة من جهازك (حد أقصى 10 ميجابايت)
5. سيتم رفع الصورة تلقائياً إلى Supabase Storage
6. سيتم حفظ رابط الصورة في قاعدة البيانات

### 2. API Endpoints الجديدة:
- **`POST /api/upload/image`** - رفع صورة واحدة
- **`POST /api/upload/images`** - رفع عدة صور
- **`DELETE /api/upload/image`** - حذف صورة

## 🔒 الأمان والحماية

### 1. تحديد أنواع الملفات:
- يقبل النظام الصور فقط (image/*)
- حد أقصى للحجم: 10 ميجابايت
- فلترة أمنية للملفات الضارة

### 2. التحقق من الصحة:
- التحقق من نوع الملف في الخادم
- التحقق من حجم الملف
- تسمية فريدة للملفات لتجنب التعارض

### 3. معالجة الأخطاء:
- رسائل خطأ واضحة باللغة العربية
- تسجيل مفصل للأخطاء
- آليات إعادة المحاولة

## 🛠️ استكشاف الأخطاء وحلها

### خطأ في الاتصال بـ Supabase:
1. تأكد من صحة SUPABASE_URL
2. تأكد من صحة مفاتيح API
3. تأكد من أن المشروع نشط ويعمل

### خطأ في رفع الصور:
1. تأكد من إنشاء `restaurant-images` bucket
2. تأكد من تفعيل Public Access
3. تأكد من Storage Policies

### خطأ في قاعدة البيانات:
1. تأكد من DATABASE_URL صحيح
2. تأكد من أن قاعدة البيانات متصلة
3. تشغيل `npm run db:push` لمزامنة الجداول

## 📊 مراقبة النظام

### في Supabase Dashboard:
- **Storage**: مراقبة استهلاك التخزين
- **Database**: مراقبة استهلاك قاعدة البيانات
- **Auth**: إدارة المصادقة (إذا مطلوبة)
- **Edge Functions**: مراقبة الوظائف (إذا مستخدمة)

### في Replit:
- مراقبة Console للأخطاء
- مراقبة استهلاك الموارد
- فحص Logs بانتظام

## 🔄 صيانة دورية

### تنظيف الملفات:
```javascript
// حذف الملفات غير المستخدمة
// يمكن تشغيلها كمهمة مجدولة
const cleanupUnusedImages = async () => {
  // كود التنظيف هنا
};
```

### نسخ احتياطية:
- Supabase يقوم بالنسخ التلقائي
- يُنصح بنسخ إضافية للملفات المهمة

## 💡 نصائح للأداء

1. **ضغط الصور**: استخدم أدوات ضغط الصور قبل الرفع
2. **تحسين الأحجام**: حدد أحجام مناسبة للشاشات المختلفة
3. **التخزين المؤقت**: استخدم CDN لتسريع تحميل الصور
4. **مراقبة الاستهلاك**: راقب استهلاك التخزين شهرياً

## 📞 الدعم والمساعدة

في حالة واجهت مشاكل:
1. تحقق من Logs في Replit Console
2. تحقق من Supabase Dashboard
3. راجع هذا الدليل مرة أخرى
4. تأكد من إعدادات Secrets

---

**ملاحظة**: هذا الإعداد يحافظ على جميع الوظائف الموجودة مسبقاً ويضيف إليها إمكانية رفع وتخزين الصور في Supabase بشكل آمن ومنظم.