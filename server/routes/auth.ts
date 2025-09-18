import express from 'express';
import { unifiedAuthService } from '../auth';

const router = express.Router();

// تسجيل الدخول الموحد
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, userType } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'المعرف وكلمة المرور مطلوبان'
      });
    }

    console.log('🔐 محاولة تسجيل دخول:', { identifier, userType });

    const result = await unifiedAuthService.login(identifier, password, userType);

    if (result.success) {
      res.json({
        success: true,
        token: result.token,
        user: result.user,
        message: result.message
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('خطأ في مسار تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// التحقق من صحة الرمز المميز
router.post('/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'رمز مميز غير صحيح'
      });
    }

    const token = authHeader.split(' ')[1];
    const validation = await unifiedAuthService.validateSession(token);

    if (validation.valid && validation.user) {
      res.json({
        success: true,
        user: validation.user,
        message: 'الرمز صحيح'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'رمز منتهي الصلاحية أو غير صحيح'
      });
    }
  } catch (error) {
    console.error('خطأ في التحقق من الرمز المميز:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// تسجيل الخروج
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'رمز مميز غير صحيح'
      });
    }

    const token = authHeader.split(' ')[1];
    const logoutSuccess = await unifiedAuthService.logout(token);

    if (logoutSuccess) {
      res.json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'فشل في تسجيل الخروج'
      });
    }
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// إنشاء مستخدم جديد (للتطوير فقط)
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, phone, password, userType } = req.body;

    if (!name || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: 'الاسم وكلمة المرور ونوع المستخدم مطلوبة'
      });
    }

    const result = await unifiedAuthService.createUser({
      name,
      username,
      email,
      phone,
      password,
      userType,
      isActive: true
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        user: result.user,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('خطأ في التسجيل:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// Middleware للتحقق من المصادقة
export const requireAuth = (allowedUserTypes?: ('customer' | 'driver' | 'admin')[]) => {
  return async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'غير مصرح - رمز مميز مطلوب'
        });
      }

      const token = authHeader.split(' ')[1];
      const validation = await unifiedAuthService.validateSession(token);

      if (!validation.valid || !validation.user) {
        return res.status(401).json({
          success: false,
          message: 'رمز منتهي الصلاحية أو غير صحيح'
        });
      }

      // التحقق من نوع المستخدم إذا تم تحديده
      if (allowedUserTypes && !allowedUserTypes.includes(validation.user.userType)) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية للوصول إلى هذا المورد'
        });
      }

      req.user = validation.user;
      req.token = token;
      next();
    } catch (error) {
      console.error('خطأ في middleware المصادقة:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في الخادم'
      });
    }
  };
};

export default router;