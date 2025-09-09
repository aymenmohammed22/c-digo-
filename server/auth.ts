import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { dbStorage } from './db';
import { type InsertAdminUser, type InsertAdminSession } from '@shared/schema';

export class AuthService {
  // تجزئة الباسورد
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // التحقق من الباسورد (لن يستخدم في تسجيل الدخول التجريبي)
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // تسجيل دخول أي بريد وكلمة مرور بنجاح دائمًا
  async loginAdmin(
    email: string,
    password: string
  ): Promise<{ success: boolean; token?: string; userType?: string; message?: string }> {
    try {
      console.log('🔍 Attempting login for email:', email);

      // تجاوز التحقق من قاعدة البيانات
      const fakeAdmin = {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Admin',
        email: email ?? 'admin@fake.com',
        userType: 'admin',
        isActive: true,
      };

      // توليد توكن وجلسة
      const token = randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const sessionData: InsertAdminSession = {
        adminId: fakeAdmin.id,
        token,
        userType: fakeAdmin.userType,
        expiresAt,
      };

      await dbStorage.createAdminSession(sessionData);

      return { success: true, token, userType: fakeAdmin.userType };
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      return { success: false, message: 'حدث خطأ في الخادم' };
    }
  }

  // التحقق من صحة الجلسة
  async validateSession(token: string): Promise<{ valid: boolean; userType?: string; adminId?: string }> {
    try {
      const session = await dbStorage.getAdminSession(token);
      if (!session) return { valid: false };

      if (new Date() > session.expiresAt) {
        await dbStorage.deleteAdminSession(token);
        return { valid: false };
      }

      return { valid: true, userType: session.userType, adminId: session.adminId || undefined };
    } catch (error) {
      console.error('خطأ في التحقق من الجلسة:', error);
      return { valid: false };
    }
  }

  // تسجيل الخروج
  async logout(token: string): Promise<boolean> {
    try {
      return await dbStorage.deleteAdminSession(token);
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      return false;
    }
  }

  // إنشاء المدير الافتراضي (يتم التجزئة)
  async createDefaultAdmin(): Promise<void> {
    try {
      console.log('Setting up default admin user...');
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456';
      const hashedPassword = await this.hashPassword(adminPassword);

      const defaultAdmin: InsertAdminUser = {
        name: 'مدير النظام',
        username: 'admin',
        email: 'admin@alsarie-one.com',
        password: hashedPassword,
        userType: 'admin',
      };

      try {
        await dbStorage.createAdminUser(defaultAdmin);
        console.log('تم إنشاء المدير الافتراضي بنجاح');
      } catch (createError: any) {
        if (createError.message?.includes('unique') || createError.code === '23505') {
          console.log('المدير الافتراضي موجود بالفعل');
        } else {
          throw createError;
        }
      }
    } catch (error) {
      console.error('خطأ في إنشاء المدير الافتراضي:', error);
    }
  }
}

// إنشاء نسخة جاهزة للاستخدام
export const authService = new AuthService();
