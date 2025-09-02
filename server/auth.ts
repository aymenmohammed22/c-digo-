import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { dbStorage } from './db';
import { type InsertAdminUser, type InsertAdminSession } from '@shared/schema';

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async loginAdmin(email: string, password: string): Promise<{ success: boolean; token?: string; userType?: string; message?: string }> {
    try {
      // البحث عن المدير في قاعدة البيانات
      const admin = await dbStorage.getAdminByEmail(email);
      
      if (!admin) {
        return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
      }

      if (!admin.isActive) {
        return { success: false, message: 'الحساب غير مفعل' };
      }

      // التحقق من كلمة المرور
      const isPasswordValid = await this.verifyPassword(password, admin.password);
      
      if (!isPasswordValid) {
        return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
      }

      // إنشاء جلسة جديدة
      const token = randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // انتهاء الصلاحية خلال 24 ساعة

      const sessionData: InsertAdminSession = {
        adminId: admin.id,
        token,
        userType: admin.userType,
        expiresAt
      };

      await dbStorage.createAdminSession(sessionData);

      return {
        success: true,
        token,
        userType: admin.userType
      };
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      return { success: false, message: 'حدث خطأ في الخادم' };
    }
  }

  async validateSession(token: string): Promise<{ valid: boolean; userType?: string; adminId?: string }> {
    try {
      const session = await dbStorage.getAdminSession(token);
      
      if (!session) {
        return { valid: false };
      }

      // التحقق من انتهاء الصلاحية
      if (new Date() > session.expiresAt) {
        // حذف الجلسة المنتهية الصلاحية
        await dbStorage.deleteAdminSession(token);
        return { valid: false };
      }

      return {
        valid: true,
        userType: session.userType,
        adminId: session.adminId || undefined
      };
    } catch (error) {
      console.error('خطأ في التحقق من الجلسة:', error);
      return { valid: false };
    }
  }

  async logout(token: string): Promise<boolean> {
    try {
      return await dbStorage.deleteAdminSession(token);
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      return false;
    }
  }

  async createDefaultAdmin(): Promise<void> {
    try {
      // التحقق من وجود مدير افتراضي
      const existingAdmin = await dbStorage.getAdminByEmail('admin@fooddelivery.com');
      
      if (!existingAdmin) {
        const hashedPassword = await this.hashPassword('admin123456');
        
        const defaultAdmin: InsertAdminUser = {
          name: 'مدير النظام',
          email: 'admin@fooddelivery.com',
          password: hashedPassword,
          userType: 'admin'
        };

        await dbStorage.createAdminUser(defaultAdmin);
        console.log('تم إنشاء المدير الافتراضي بنجاح');
      }
    } catch (error) {
      console.error('خطأ في إنشاء المدير الافتراضي:', error);
    }
  }
}

export const authService = new AuthService();