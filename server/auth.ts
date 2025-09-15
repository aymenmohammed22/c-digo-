 import bcrypt from 'bcrypt'; // تم التعديل هنا
import { randomUUID } from 'crypto';
import { storage } from './storage';
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
      console.log('🔍 Attempting login for email:', email);
      const admin = await storage.getAdminByEmail(email);
      if (!admin) return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
      console.log('✅ Admin found, checking isActive:', admin.isActive, 'Type:', typeof admin.isActive);
      if (!admin.isActive) return { success: false, message: 'الحساب غير مفعل' };
      const isPasswordValid = await this.verifyPassword(password, admin.password);
      if (!isPasswordValid) return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
      const token = randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      const sessionData: InsertAdminSession = {
        adminId: admin.id,
        token,
        userType: admin.userType,
        expiresAt
      };
      await storage.createAdminSession(sessionData);
      return { success: true, token, userType: admin.userType };
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      return { success: false, message: 'حدث خطأ في الخادم' };
    }
  }
  async validateSession(token: string): Promise<{ valid: boolean; userType?: string; adminId?: string }> {
    try {
      const session = await storage.getAdminSession(token);
      if (!session) return { valid: false };
      if (new Date() > session.expiresAt) {
        await storage.deleteAdminSession(token);
        return { valid: false };
      }
      return { valid: true, userType: session.userType, adminId: session.adminId || undefined };
    } catch (error) {
      console.error('خطأ في التحقق من الجلسة:', error);
      return { valid: false };
    }
  }
  async logout(token: string): Promise<boolean> {
    try {
      return await storage.deleteAdminSession(token);
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      return false;
    }
  }
  // تم حذف دالة createDefaultAdmin لتجنب التعارض مع بيانات قاعدة البيانات الحقيقية
}
export const authService = new AuthService();

