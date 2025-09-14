import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  userType: 'admin' | 'driver' | null;
  token: string | null;
  adminId: string | null;
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // DEV ONLY: Auth bypass for development/testing - NEVER in production
    const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;
    const enableDevBypass = isDevelopment && import.meta.env.VITE_ENABLE_DEV_AUTH_BYPASS === 'true';
    
    if (enableDevBypass) {
      const currentPath = window.location.pathname;
      
      if (currentPath.startsWith('/admin')) {
        console.log('🔓 DEV BYPASS: Auto-authenticating as admin for development testing');
        setAuthState({
          isAuthenticated: true,
          userType: 'admin',
          token: 'dev-admin-token',
          adminId: 'dev-admin-id',
        });
        setLoading(false);
        return;
      } else if (currentPath.startsWith('/delivery')) {
        console.log('🔓 DEV BYPASS: Auto-authenticating as driver for development testing');
        setAuthState({
          isAuthenticated: true,
          userType: 'driver',
          token: 'dev-driver-token',
          adminId: 'dev-driver-id',
        });
        setLoading(false);
        return;
      }
    }

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
        });
      } else {
        localStorage.removeItem('admin_token');
        setAuthState({
          isAuthenticated: false,
          userType: null,
          token: null,
          adminId: null,
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
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};