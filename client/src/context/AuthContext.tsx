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
    // TEMPORARY BYPASS: Auto-authenticate for testing both admin and delivery apps
    const currentPath = window.location.pathname;
    
    if (currentPath.startsWith('/admin')) {
      console.log('TEMPORARY AUTH BYPASS: Auto-authenticating as admin for testing');
      setAuthState({
        isAuthenticated: true,
        userType: 'admin',
        token: 'temp-admin-token',
        adminId: 'temp-admin-id',
      });
    } else if (currentPath.startsWith('/delivery')) {
      console.log('TEMPORARY AUTH BYPASS: Auto-authenticating as driver for testing');
      setAuthState({
        isAuthenticated: true,
        userType: 'driver',
        token: 'temp-driver-token',
        adminId: 'temp-driver-id',
      });
    } else {
      // For customer app, no authentication needed
      setAuthState({
        isAuthenticated: false,
        userType: null,
        token: null,
        adminId: null,
      });
    }
    setLoading(false);
    
    /* ORIGINAL CODE (commented out for testing):
    const token = localStorage.getItem('admin_token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
    */
  }, []);

  // Temporarily disabled during testing
  // const verifyToken = async (token: string) => { ... }

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