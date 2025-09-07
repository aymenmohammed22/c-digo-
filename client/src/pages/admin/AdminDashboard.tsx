import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationSystem } from '@/components/NotificationSystem';
import { UiControlPanel } from '@/components/UiControlPanel';
import { DriverControlPanel } from '@/components/DriverControlPanel';
import { 
  BarChart3, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Settings, 
  LogOut,
  Package,
  Truck,
  Store,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/admin/dashboard'],
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  const handleLogout = () => {
    logout();
  };

  const stats = dashboardData?.stats || {
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    activeDrivers: 0,
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    totalRestaurants: 0
  };

  const recentOrders = dashboardData?.recentOrders || [];

  const statCards = [
    { 
      title: 'إجمالي الطلبات', 
      value: stats.totalOrders?.toLocaleString() || '0', 
      icon: ShoppingBag, 
      color: 'text-blue-600',
      change: '+12%',
      changeColor: 'text-green-600'
    },
    { 
      title: 'العملاء النشطين', 
      value: stats.totalCustomers?.toLocaleString() || '0', 
      icon: Users, 
      color: 'text-green-600',
      change: '+8%',
      changeColor: 'text-green-600'
    },
    { 
      title: 'إجمالي المبيعات', 
      value: `${stats.totalRevenue?.toLocaleString() || '0'} ريال`, 
      icon: DollarSign, 
      color: 'text-orange-600',
      change: '+15%',
      changeColor: 'text-green-600'
    },
    { 
      title: 'السائقين المتاحين', 
      value: stats.activeDrivers?.toLocaleString() || '0', 
      icon: Truck, 
      color: 'text-purple-600',
      change: '+2',
      changeColor: 'text-green-600'
    },
  ];

  const todayStats = [
    { 
      title: 'طلبات اليوم', 
      value: stats.todayOrders?.toLocaleString() || '0', 
      icon: Package, 
      color: 'text-blue-500' 
    },
    { 
      title: 'إيرادات اليوم', 
      value: `${stats.todayRevenue?.toLocaleString() || '0'} ريال`, 
      icon: TrendingUp, 
      color: 'text-green-500' 
    },
    { 
      title: 'طلبات معلقة', 
      value: stats.pendingOrders?.toLocaleString() || '0', 
      icon: Clock, 
      color: 'text-yellow-500' 
    },
    { 
      title: 'المطاعم النشطة', 
      value: stats.totalRestaurants?.toLocaleString() || '0', 
      icon: Store, 
      color: 'text-purple-500' 
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">مرحباً، {user?.name}</h1>
              <p className="text-gray-600 mt-1">إليك نظرة عامة على أداء النظام اليوم</p>
            </div>
            <div className="text-sm text-gray-500">
              آخر تحديث: {new Date().toLocaleTimeString('ar-YE')}
            </div>
          </div>
        </div>

        {/* Notification System */}
        <div className="mb-8">
          <NotificationSystem userType="admin" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className={`text-sm ${stat.changeColor} flex items-center mt-1`}>
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {stat.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full bg-gray-100`}>
                      <Icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="ui-settings">إعدادات الواجهة</TabsTrigger>
            <TabsTrigger value="driver-settings">إعدادات السائق</TabsTrigger>
            <TabsTrigger value="system">إعدادات النظام</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Today's Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {todayStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="text-center">
                    <CardContent className="p-6">
                      <Icon className={`h-8 w-8 ${stat.color} mx-auto mb-3`} />
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    الطلبات الحديثة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.length > 0 ? (
                      recentOrders.slice(0, 5).map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div>
                            <p className="font-medium">طلب #{order.orderNumber}</p>
                            <p className="text-sm text-gray-600">{order.customerName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleString('ar-YE')}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              order.status === 'delivered' ? 'default' :
                              order.status === 'pending' ? 'secondary' :
                              order.status === 'cancelled' ? 'destructive' : 'outline'
                            }>
                              {order.status === 'pending' ? 'في الانتظار' :
                               order.status === 'confirmed' ? 'مؤكد' :
                               order.status === 'preparing' ? 'قيد التحضير' :
                               order.status === 'delivered' ? 'تم التوصيل' :
                               order.status === 'cancelled' ? 'ملغي' : order.status}
                            </Badge>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              {order.total} ريال
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">لا توجد طلبات حديثة</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    إجراءات سريعة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3"
                      onClick={() => setActiveTab('ui-settings')}
                    >
                      <Eye className="h-5 w-5 text-blue-500" />
                      إعدادات الواجهة
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3"
                      onClick={() => setActiveTab('driver-settings')}
                    >
                      <Truck className="h-5 w-5 text-green-500" />
                      إعدادات السائق
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3"
                      onClick={() => window.location.href = '/admin/restaurants'}
                    >
                      <Store className="h-5 w-5 text-orange-500" />
                      إدارة المطاعم
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3"
                      onClick={() => window.location.href = '/admin/orders'}
                    >
                      <Package className="h-5 w-5 text-purple-500" />
                      إدارة الطلبات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ui-settings" className="space-y-6">
            <UiControlPanel />
          </TabsContent>

          <TabsContent value="driver-settings" className="space-y-6">
            <DriverControlPanel />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  إعدادات النظام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">معلومات النظام</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">الإصدار:</span> 1.0.0</p>
                        <p><span className="font-medium">قاعدة البيانات:</span> متصلة</p>
                        <p><span className="font-medium">آخر نسخ احتياطي:</span> اليوم</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">إحصائيات الأداء</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">وقت الاستجابة:</span> 120ms</p>
                        <p><span className="font-medium">الذاكرة المستخدمة:</span> 45%</p>
                        <p><span className="font-medium">مساحة التخزين:</span> 2.1GB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}