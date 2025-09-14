import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Home, Search, Receipt, User, Menu, Settings, Shield, MapPin, Clock, Truck, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '../context/CartContext';
import CartButton from './CartButton';
import { useToast } from '@/hooks/use-toast';

interface LayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
  testId: string;
  className?: string;
}

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { getItemCount } = useCart();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  
  // States for profile click counter
  const [profileClickCount, setProfileClickCount] = useState(0);
  const [lastProfileClickTime, setLastProfileClickTime] = useState(0);
  
  // States for admin panel and delivery app visibility
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showDeliveryApp, setShowDeliveryApp] = useState(false);
  const [showOrdersPage, setShowOrdersPage] = useState(true);
  const [showTrackOrdersPage, setShowTrackOrdersPage] = useState(true);
  
  // Load visibility settings from localStorage
  useEffect(() => {
    const adminPanelVisible = localStorage.getItem('show_admin_panel') === 'true';
    const deliveryAppVisible = localStorage.getItem('show_delivery_app') === 'true';
    const ordersPageVisible = localStorage.getItem('show_orders_page') !== 'false';
    const trackOrdersPageVisible = localStorage.getItem('show_track_orders_page') !== 'false';
    setShowAdminPanel(adminPanelVisible);
    setShowDeliveryApp(deliveryAppVisible);
    setShowOrdersPage(ordersPageVisible);
    setShowTrackOrdersPage(trackOrdersPageVisible);
  }, []);

  // Listen for navigation settings changes from admin panel
  useEffect(() => {
    const handleNavigationChange = (event: CustomEvent) => {
      const { key, enabled } = event.detail;
      if (key === 'show_admin_panel') {
        setShowAdminPanel(enabled);
      } else if (key === 'show_delivery_app') {
        setShowDeliveryApp(enabled);
      } else if (key === 'show_orders_page') {
        setShowOrdersPage(enabled);
      } else if (key === 'show_track_orders_page') {
        setShowTrackOrdersPage(enabled);
      }
    };

    window.addEventListener('navigationSettingsChanged', handleNavigationChange as EventListener);
    return () => {
      window.removeEventListener('navigationSettingsChanged', handleNavigationChange as EventListener);
    };
  }, []);

  const isHomePage = location === '/';
  const isAdminPage = location.startsWith('/admin');
  const isDeliveryPage = location.startsWith('/delivery');

  // Dynamic navigation items based on visibility settings
  const navigationItems = [
    { icon: Home, label: 'الرئيسية', path: '/', testId: 'nav-home' },
    { icon: Search, label: 'البحث', path: '/search', testId: 'nav-search' },
    ...(showOrdersPage ? [{ icon: Receipt, label: 'طلباتي', path: '/orders', testId: 'nav-orders' }] : []),
    { icon: User, label: 'الملف الشخصي', path: '/profile', testId: 'nav-profile' },
  ];

  // Dynamic sidebar menu items based on visibility settings
  const baseSidebarMenuItems = [
    { icon: User, label: 'الملف الشخصي', path: '/profile', testId: 'sidebar-profile' },
    ...(showOrdersPage ? [{ icon: Receipt, label: 'طلباتي', path: '/orders', testId: 'sidebar-orders' }] : []),
    { icon: MapPin, label: 'العناوين المحفوظة', path: '/addresses', testId: 'sidebar-addresses' },
    ...(showTrackOrdersPage ? [{ icon: Clock, label: 'تتبع الطلبات', path: '/track-orders', testId: 'sidebar-tracking' }] : []),
    { icon: Settings, label: 'الإعدادات', path: '/settings', testId: 'sidebar-settings' },
    { icon: Shield, label: 'سياسة الخصوصية', path: '/privacy', testId: 'sidebar-privacy' },
  ];
  
  // Admin and delivery buttons (conditionally added)
  const adminDeliveryItems = [];
  if (showAdminPanel) {
    adminDeliveryItems.push({ 
      icon: UserCog, 
      label: 'لوحة التحكم', 
      path: '/admin', 
      testId: 'sidebar-admin',
      className: 'text-blue-600 border-l-4 border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
    });
  }
  if (showDeliveryApp) {
    adminDeliveryItems.push({ 
      icon: Truck, 
      label: 'تطبيق التوصيل', 
      path: '/delivery', 
      testId: 'sidebar-delivery',
      className: 'text-green-600 border-l-4 border-green-600 bg-green-50 dark:bg-green-900/20' 
    });
  }
  
  // Complete sidebar menu items
  const sidebarMenuItems = [...baseSidebarMenuItems, ...adminDeliveryItems];

  // وظيفة التعامل مع النقر على أيقونة الملف الشخصي
  const handleProfileIconClick = () => {
    const currentTime = Date.now();
    
    // إذا مر أكثر من ثانيتين منذ آخر نقرة، نعيد العداد
    if (currentTime - lastProfileClickTime > 2000) {
      setProfileClickCount(1);
    } else {
      setProfileClickCount(prev => prev + 1);
    }
    
    setLastProfileClickTime(currentTime);

    // إذا وصل إلى 5 نقرات
    if (profileClickCount + 1 === 5) {
      toast({
        title: "الوصول إلى صفحة تسجيل الدخول",
        description: "سيتم الانتقال إلى صفحة تسجيل الدخول للإدارة",
      });
      
      // الانتقال إلى صفحة تسجيل الدخول
      window.location.href = '/admin-login';
      setProfileClickCount(0);
    } else if (profileClickCount + 1 > 2) {
      // إشعار بعد النقرات الأولى
      toast({
        title: `نقرة ${profileClickCount + 1} من 5`,
        description: "استمر للنقل للوصول إلى صفحة تسجيل الدخول",
      });
    }
  };

  // إعادة تعيين عداد النقرات بعد 2 ثانية
  useEffect(() => {
    if (profileClickCount > 0) {
      const timer = setTimeout(() => {
        setProfileClickCount(0);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [profileClickCount, lastProfileClickTime]);

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen shadow-xl relative">
      {/* Header - Redesigned to match reference */}
      <header className="gradient-header text-white sticky top-0 z-40 p-4">
        <div className="flex items-center justify-between mb-4">
          {/* Right side - Menu and User icons */}
          <div className="flex items-center gap-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  data-testid="button-menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-right">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">مرحباً بك</h3>
                        <p className="text-sm text-muted-foreground">في تطبيق السريع ون</p>
                      </div>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="mt-8 space-y-2">
                  {sidebarMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isSpecialButton = item.className;
                    return (
                      <Button
                        key={item.path}
                        variant="ghost"
                        className={`w-full justify-start gap-3 h-12 ${item.className || ''}`}
                        onClick={() => {
                          setLocation(item.path);
                          setSidebarOpen(false);
                        }}
                        data-testid={item.testId}
                      >
                        <Icon className={`h-5 w-5 ${isSpecialButton ? '' : 'text-primary'}`} />
                        <span className={isSpecialButton ? '' : 'text-foreground'}>{item.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleProfileIconClick}
              className="relative text-white hover:bg-white/20"
              title="النقر 5 مرات للوصول إلى صفحة تسجيل الدخول"
              data-testid="button-profile"
            >
              <User className="h-6 w-6" />
              {profileClickCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full text-xs text-primary flex items-center justify-center">
                  {profileClickCount}
                </div>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              data-testid="button-search"
            >
              <Search className="h-6 w-6" />
            </Button>
          </div>

          {/* Center - Title and Location */}
          <div className="text-center flex-1" 
               onClick={() => {
                const newCount = logoClickCount + 1;
                setLogoClickCount(newCount);
                
                if (newCount === 4) {
                  setLogoClickCount(0);
                  window.location.href = '/admin-login';
                } else if (newCount > 4) {
                  setLogoClickCount(0);
                }
                
                setTimeout(() => {
                  setLogoClickCount(0);
                }, 3000);
              }}
          >
            <h1 className="text-xl font-bold text-white">السريع ون</h1>
            <div className="flex items-center justify-center gap-1 text-sm text-white/90">
              <MapPin className="h-4 w-4" />
              <span>اختيار العنوان</span>
            </div>
            
            {logoClickCount > 0 && logoClickCount < 4 && (
              <div className="flex gap-1 justify-center mt-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i < logoClickCount ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Left side - Location pin icon */}
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MapPin className="h-5 w-5 text-white" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 bg-gray-50 min-h-screen">
        {children}
      </main>

      {/* Bottom Navigation - hide on admin and delivery pages */}
      {!isAdminPage && !isDeliveryPage && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border px-4 py-2">
          <div className="flex justify-around items-center">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`flex flex-col items-center gap-1 py-2 px-3 ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setLocation(item.path)}
                  data-testid={item.testId}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Floating Cart Button - hide on admin and delivery pages */}
      {getItemCount() > 0 && !isAdminPage && !isDeliveryPage && <CartButton />}
    </div>
  );
}