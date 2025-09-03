import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DriverControlPanel } from '../components/DriverControlPanel';
import { useUiSettings } from '../context/UiSettingsContext';
import { 
  Truck, 
  MapPin, 
  Clock, 
  DollarSign, 
  LogOut,
  Navigation,
  Phone,
  CheckCircle,
  XCircle,
  Package,
  Settings
} from 'lucide-react';

interface DriverDashboardProps {
  onLogout: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ onLogout }) => {
  const { logout } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
  };

  const acceptOrder = (orderId: string) => {
    setCurrentOrder({
      id: orderId,
      customer: 'محمد أحمد',
      phone: '0591234567',
      address: 'شارع الزبيري، صنعاء',
      restaurant: 'مطعم الوزيكو للعربكة',
      items: 'عربكة بالقشطة والعسل × 2',
      total: '₪110',
      status: 'accepted'
    });
  };

  const completeOrder = () => {
    setCurrentOrder(null);
  };

  const pendingOrders = [
    {
      id: '1001',
      customer: 'محمد أحمد',
      restaurant: 'مطعم الوزيكو للعربكة',
      address: 'شارع الزبيري، صنعاء',
      distance: '2.5 كم',
      fee: '₪15',
      time: 'منذ 5 دقائق'
    },
    {
      id: '1002',
      customer: 'سارة علي',
      restaurant: 'حلويات الشام',
      address: 'شارع الستين، صنعاء',
      distance: '1.8 كم',
      fee: '₪12',
      time: 'منذ 8 دقائق'
    }
  ];

  const todayStats = {
    deliveries: 12,
    earnings: '₪180',
    hours: '8.5',
    distance: '45 كم'
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">تطبيق السائق</h1>
                <p className="text-sm text-gray-500">أحمد محمد</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant={isAvailable ? "default" : "outline"}
                onClick={toggleAvailability}
                className={isAvailable ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {isAvailable ? 'متاح' : 'غير متاح'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Current Order */}
        {currentOrder && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Package className="h-5 w-5" />
                الطلب الحالي - #{currentOrder.id}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">{currentOrder.customer}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Phone className="h-4 w-4" />
                      {currentOrder.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="h-4 w-4" />
                      {currentOrder.address}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">{currentOrder.restaurant}</p>
                    <p className="text-sm text-gray-600 mt-1">{currentOrder.items}</p>
                    <p className="text-lg font-bold text-green-600 mt-2">{currentOrder.total}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Navigation className="h-4 w-4 mr-2" />
                    فتح الخريطة
                  </Button>
                  <Button className="flex-1" onClick={completeOrder}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    تم التسليم
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{todayStats.deliveries}</p>
                <p className="text-sm text-gray-600">توصيلات اليوم</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{todayStats.earnings}</p>
                <p className="text-sm text-gray-600">أرباح اليوم</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{todayStats.hours}</p>
                <p className="text-sm text-gray-600">ساعات العمل</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <MapPin className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{todayStats.distance}</p>
                <p className="text-sm text-gray-600">المسافة المقطوعة</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Orders */}
        {isAvailable && !currentOrder && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                الطلبات المتاحة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingOrders.length > 0 ? (
                <div className="space-y-4">
                  {pendingOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">طلب #{order.id}</p>
                          <p className="text-sm text-gray-600">{order.customer}</p>
                        </div>
                        <Badge variant="secondary">{order.time}</Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-gray-400" />
                          {order.restaurant}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {order.address}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>المسافة: {order.distance}</span>
                          <span className="font-medium text-green-600">{order.fee}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button 
                          className="flex-1"
                          onClick={() => acceptOrder(order.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          قبول الطلب
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <XCircle className="h-4 w-4 mr-2" />
                          رفض
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد طلبات متاحة حالياً</p>
                  <p className="text-sm text-gray-400 mt-2">سيتم إشعارك عند توفر طلبات جديدة</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Offline Status */}
        {!isAvailable && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-600 mb-2">أنت غير متاح حالياً</p>
                <p className="text-sm text-gray-400 mb-4">قم بتفعيل حالة المتاح لاستلام الطلبات</p>
                <Button onClick={toggleAvailability} className="bg-green-600 hover:bg-green-700">
                  تفعيل حالة المتاح
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};