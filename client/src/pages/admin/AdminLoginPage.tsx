import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const { login, userType, loading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // إعادة توجيه إذا كان المستخدم مسجل دخول بالفعل
  useEffect(() => {
    if (isAuthenticated && userType === 'admin') {
      setLocation('/admin');
    }
  }, [isAuthenticated, userType, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('يرجى إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await login(formData.email, formData.password, 'admin');
      
      if (result.success) {
        setLocation('/admin');
      } else {
        setError(result.message || 'فشل في تسجيل الدخول');
      }
    } catch (error) {
      setError('حدث خطأ غير متوقع');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(''); // مسح الخطأ عند الكتابة
  };

  // دخول سريع بصلاحيات المدير
  const handleQuickLogin = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login('admin@alsarie-one.com', 'admin123456', 'admin');
      
      if (result.success) {
        setLocation('/admin');
      } else {
        setError(result.message || 'فشل في تسجيل الدخول');
      }
    } catch (error) {
      setError('حدث خطأ غير متوقع');
    } finally {
      setIsSubmitting(false);
    }
  };

  // تعبئة البيانات الافتراضية
  const fillDefaultCredentials = () => {
    setFormData({
      email: 'admin@alsarie-one.com',
      password: 'admin123456'
    });
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم</h1>
          <p className="text-gray-600">تسجيل دخول المدير</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-gray-800">
              مرحباً بك
            </CardTitle>
            <p className="text-center text-gray-600 text-sm">
              أدخل بياناتك للوصول إلى لوحة التحكم
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  اسم المستخدم أو البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="text"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="اسم المستخدم أو admin@example.com"
                    className="pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="pr-10 pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>

                {/* أزرار الدخول السريع - بيئة التطوير فقط */}
                {(import.meta.env.MODE === 'development' || import.meta.env.DEV) && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      onClick={handleQuickLogin}
                      className="h-10 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      disabled={isSubmitting}
                    >
                      🚀 دخول سريع
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={fillDefaultCredentials}
                      variant="outline"
                      className="h-10 border-green-300 text-green-700 hover:bg-green-50 text-sm font-medium rounded-lg transition-all duration-200"
                      disabled={isSubmitting}
                    >
                      📝 تعبئة البيانات
                    </Button>
                  </div>
                )}
              </div>
            </form>

            {/* Demo Credentials - بيئة التطوير فقط */}
            {(import.meta.env.MODE === 'development' || import.meta.env.DEV) && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 font-medium mb-2">🔑 بيانات المدير الافتراضية (تطوير):</p>
                <div className="text-xs text-green-700 space-y-1">
                  <p>البريد الإلكتروني: admin@alsarie-one.com</p>
                  <p>كلمة المرور: admin123456</p>
                </div>
                <p className="text-xs text-green-600 mt-2">💡 استخدم "دخول سريع" أو "تعبئة البيانات" للدخول بسرعة</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © 2024 السريع ون - جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
}