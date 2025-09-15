import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  userType: 'admin' | 'driver' | null;
  token: string | null;
  adminId: string | null;
  user: { name: string; email?: string; phone?: string } | null;
}

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string, userType?: 'admin' | 'driver') => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userType: null,
    token: null,
    adminId: null,
    user: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Authentication bypasses removed - all authentication must go through proper login
    // Normal authentication flow
    const token = localStorage.getItem('admin_token');
    if (token) {
      verifyToken(token);
    } else {
      setAuthState({
        isAuthenticated: false,
        userType: null,
        token: null,
        adminId: null,
        user: null,
      });
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/admin/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          isAuthenticated: true,
          userType: data.userType || 'admin',
          token: token,
          adminId: data.adminId || 'admin-main',
          user: { name: data.name || 'مدير النظام', email: data.email },
        });
      } else {
        localStorage.removeItem('admin_token');
        setAuthState({
          isAuthenticated: false,
          userType: null,
          token: null,
          adminId: null,
          user: null,
        });
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('admin_token');
      setAuthState({
        isAuthenticated: false,
        userType: null,
        token: null,
        adminId: null,
        user: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier: string, password: string, userType: 'admin' | 'driver' = 'admin') => {
    try {
      const endpoint = userType === 'driver' ? '/api/driver/login' : '/api/admin/login';
      const requestBody = userType === 'driver' 
        ? { phone: identifier, password }
        : { email: identifier, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('admin_token', data.token);
        setAuthState({
          isAuthenticated: true,
          userType: userType,
          token: data.token,
          adminId: data.admin?.id || data.driver?.id || 'admin-main',
          user: {
            name: data.admin?.name || data.driver?.name || 'مستخدم النظام',
            email: data.admin?.email,
            phone: data.driver?.phone
          },
        });
        return { success: true, message: data.message || 'تم تسجيل الدخول بنجاح' };
      } else {
        return { success: false, message: data.message || data.error || 'خطأ في تسجيل الدخول' };
      }
    } catch (error) {
      return { success: false, message: 'خطأ في الاتصال بالخادم' };
    }
  };

  const logout = async () => {
    try {
      if (authState.token) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: authState.token }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.removeItem('admin_token');
    setAuthState({
      isAuthenticated: false,
      userType: null,
      token: null,
      adminId: null,
      user: null,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};