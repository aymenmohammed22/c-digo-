import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Package, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  orderNumber: string;
  restaurantName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'on_way' | 'delivered' | 'cancelled';
  createdAt: string;
  estimatedDelivery?: string;
}

export default function OrdersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  // Mock orders data - in real app this would come from API
  const [orders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'ORD001',
      restaurantName: 'مطعم الزعتر الأصيل',
      items: [
        { name: 'عربكة بالقشطة والعسل', quantity: 2, price: 55 },
        { name: 'شاي كرك', quantity: 1, price: 8 }
      ],
      totalAmount: '118',
      status: 'on_way',
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      estimatedDelivery: '25 دقيقة'
    },
    {
      id: '2',
      orderNumber: 'ORD002',
      restaurantName: 'مطعم البخاري الملكي',
      items: [
        { name: 'برياني لحم', quantity: 1, price: 45 },
        { name: 'سلطة يوغرت', quantity: 1, price: 12 }
      ],
      totalAmount: '62',
      status: 'delivered',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString()
    },
    {
      id: '3',
      orderNumber: 'ORD003',
      restaurantName: 'مطعم الكباب التركي',
      items: [
        { name: 'كباب مشكل', quantity: 1, price: 38 },
        { name: 'خبز تركي', quantity: 2, price: 6 }
      ],
      totalAmount: '49',
      status: 'cancelled',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60000).toISOString()
    }
  ]);

  const getStatusLabel = (status: string) => {
    const statusMap = {
      pending: 'قيد المراجعة',
      confirmed: 'مؤكد',
      preparing: 'قيد التحضير',
      on_way: 'في الطريق',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-orange-500',
      on_way: 'bg-purple-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    const iconMap = {
      pending: Clock,
      confirmed: Package,
      preparing: Package,
      on_way: Package,
      delivered: CheckCircle,
      cancelled: XCircle
    };
    return iconMap[status as keyof typeof iconMap] || Clock;
  };

  const filteredOrders = orders.filter(order => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'active') return ['pending', 'confirmed', 'preparing', 'on_way'].includes(order.status);
    if (selectedTab === 'completed') return order.status === 'delivered';
    if (selectedTab === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  const handleViewOrder = (orderId: string) => {
    setLocation(`/orders/${orderId}`);
  };

  const handleReorder = (order: Order) => {
    toast({
      title: "جاري إعادة الطلب",
      description: `سيتم إضافة عناصر طلب ${order.orderNumber} إلى السلة`,
    });
  };

  const tabs = [
    { id: 'all', label: 'جميع الطلبات', count: orders.length },
    { id: 'active', label: 'النشطة', count: orders.filter(o => ['pending', 'confirmed', 'preparing', 'on_way'].includes(o.status)).length },
    { id: 'completed', label: 'المكتملة', count: orders.filter(o => o.status === 'delivered').length },
    { id: 'cancelled', label: 'الملغية', count: orders.filter(o => o.status === 'cancelled').length }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/')}
              data-testid="button-back"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">طلباتي</h1>
              <p className="text-sm text-gray-500">تتبع ومراجعة طلباتك</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto p-4">
        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="text-xs relative"
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                    {tab.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد طلبات</h3>
                  <p className="text-gray-500 mb-4">لم تقم بأي طلبات بعد</p>
                  <Button onClick={() => setLocation('/')} data-testid="button-start-ordering">
                    ابدأ الطلب الآن
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                
                return (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-bold">{order.restaurantName}</CardTitle>
                          <p className="text-sm text-gray-500">طلب رقم: {order.orderNumber}</p>
                        </div>
                        <Badge 
                          className={`${getStatusColor(order.status)} text-white`}
                          data-testid={`badge-status-${order.status}`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Order Items */}
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="font-medium">{item.price} ر.س</span>
                          </div>
                        ))}
                      </div>

                      {/* Order Summary */}
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>عدد الأصناف: {totalItems}</span>
                          <span>المجموع: {order.totalAmount} ر.س</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>تاريخ الطلب: {new Date(order.createdAt).toLocaleDateString('ar-SA')}</span>
                          {order.estimatedDelivery && (
                            <span>الوقت المتوقع: {order.estimatedDelivery}</span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewOrder(order.id)}
                          data-testid={`button-view-order-${order.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          تتبع الطلب
                        </Button>
                        
                        {order.status === 'delivered' && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleReorder(order)}
                            data-testid={`button-reorder-${order.id}`}
                          >
                            إعادة الطلب
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}