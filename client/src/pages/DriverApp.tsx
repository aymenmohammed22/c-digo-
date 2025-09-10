import React, { useState, useEffect } from 'react';
import { MapPin, Phone, DollarSign, Clock, CheckCircle, XCircle, Bell } from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes?: string;
  totalAmount: string;
  estimatedTime: string;
  status: string;
  items: string;
  createdAt: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  earnings: string;
  isAvailable: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function DriverApp() {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'myorders' | 'profile'>('available');
  const [isLoading, setIsLoading] = useState(false);

  // Mock driver ID - في التطبيق الحقيقي سيأتي من تسجيل الدخول
  const driverId = 'a4538fc1-06db-416f-b359-38d8e79b0809';

  useEffect(() => {
    fetchDriverInfo();
    fetchAvailableOrders();
    fetchMyOrders();
    fetchNotifications();
    
    // تحديث البيانات كل 30 ثانية
    const interval = setInterval(() => {
      fetchAvailableOrders();
      fetchMyOrders();
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDriverInfo = async () => {
    try {
      const response = await fetch(`/api/drivers/${driverId}`);
      const data = await response.json();
      setDriver(data);
    } catch (error) {
      console.error('خطأ في جلب معلومات السائق:', error);
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      const response = await fetch(`/api/drivers/${driverId}/available-orders`);
      const data = await response.json();
      setAvailableOrders(data);
    } catch (error) {
      console.error('خطأ في جلب الطلبات المتاحة:', error);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const response = await fetch(`/api/orders?driverId=${driverId}`);
      const data = await response.json();
      setMyOrders(data.filter((order: Order) => order.status !== 'delivered'));
    } catch (error) {
      console.error('خطأ في جلب طلباتي:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?recipientType=driver&recipientId=${driverId}&unread=true`);
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
    }
  };

  const acceptOrder = async (orderId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/assign-driver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId })
      });
      
      if (response.ok) {
        fetchAvailableOrders();
        fetchMyOrders();
      }
    } catch (error) {
      console.error('خطأ في قبول الطلب:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        fetchMyOrders();
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة الطلب:', error);
    }
  };

  const toggleAvailability = async () => {
    if (!driver) return;
    
    try {
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !driver.isAvailable })
      });
      
      if (response.ok) {
        fetchDriverInfo();
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة التوفر:', error);
    }
  };

  const parseItems = (itemsJson: string) => {
    try {
      return JSON.parse(itemsJson);
    } catch {
      return [];
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">مرحباً {driver?.name}</h1>
            <p className="text-gray-600">أرباحك اليوم: {driver?.earnings} شيكل</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="text-gray-600" size={24} />
              {notifications.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </div>
            <button
              onClick={toggleAvailability}
              className={`px-4 py-2 rounded-lg font-semibold ${
                driver?.isAvailable
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {driver?.isAvailable ? 'متاح' : 'غير متاح'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'available'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          الطلبات المتاحة ({availableOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('myorders')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'myorders'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          طلباتي ({myOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ملفي الشخصي
        </button>
      </div>

      {/* Available Orders Tab */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">الطلبات المتاحة</h2>
          {!driver?.isAvailable && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              يجب تفعيل حالة "متاح" لرؤية الطلبات الجديدة
            </div>
          )}
          {availableOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد طلبات متاحة حالياً
            </div>
          ) : (
            availableOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{order.customerName}</h3>
                    <p className="text-gray-600 flex items-center gap-1">
                      <Phone size={16} />
                      {order.customerPhone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">{order.totalAmount} شيكل</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock size={14} />
                      {order.estimatedTime}
                    </p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-700 flex items-start gap-1">
                    <MapPin size={16} className="mt-1 flex-shrink-0" />
                    {order.deliveryAddress}
                  </p>
                  {order.notes && (
                    <p className="text-sm text-gray-600 mt-2">ملاحظات: {order.notes}</p>
                  )}
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">الأصناف:</h4>
                  <div className="space-y-1">
                    {parseItems(order.items).map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name} × {item.quantity}</span>
                        <span>{(item.price * item.quantity).toFixed(2)} شيكل</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => acceptOrder(order.id)}
                  disabled={isLoading || !driver?.isAvailable}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  قبول الطلب
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* My Orders Tab */}
      {activeTab === 'myorders' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">طلباتي الحالية</h2>
          {myOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد طلبات حالية
            </div>
          ) : (
            myOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{order.customerName}</h3>
                    <p className="text-gray-600 flex items-center gap-1">
                      <Phone size={16} />
                      {order.customerPhone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">{order.totalAmount} شيكل</p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'picked_up' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'on_way' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {order.status === 'assigned' ? 'تم التكليف' :
                       order.status === 'picked_up' ? 'تم الاستلام' :
                       order.status === 'on_way' ? 'في الطريق' : 'تم التسليم'}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-700 flex items-start gap-1">
                    <MapPin size={16} className="mt-1 flex-shrink-0" />
                    {order.deliveryAddress}
                  </p>
                </div>

                <div className="flex gap-2">
                  {order.status === 'assigned' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'picked_up')}
                      className="flex-1 bg-yellow-600 text-white py-2 rounded-lg font-semibold hover:bg-yellow-700"
                    >
                      تم الاستلام من المطعم
                    </button>
                  )}
                  {order.status === 'picked_up' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'on_way')}
                      className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700"
                    >
                      في الطريق للعميل
                    </button>
                  )}
                  {order.status === 'on_way' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
                    >
                      تم التسليم
                    </button>
                  )}
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Phone size={16} />
                    اتصال
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && driver && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800">ملفي الشخصي</h2>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                <p className="text-lg text-gray-900">{driver.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <p className="text-lg text-gray-900">{driver.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">إجمالي الأرباح</label>
                <p className="text-2xl font-bold text-green-600">{driver.earnings} شيكل</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  driver.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {driver.isAvailable ? 'متاح للعمل' : 'غير متاح'}
                </span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">الإشعارات الحديثة</h3>
            {notifications.length === 0 ? (
              <p className="text-gray-500">لا توجد إشعارات جديدة</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-medium text-gray-800">{notification.title}</h4>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleString('ar')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}