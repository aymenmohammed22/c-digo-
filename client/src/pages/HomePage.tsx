import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Search, 
  MapPin, 
  Clock, 
  Star, 
  ShoppingBag,
  Percent,
  Filter,
  Grid,
  List,
  ChevronRight,
  Truck,
  Settings,
  User,
  Menu,
  Beef,
  Cookie,
  UtensilsCrossed,
  Heart,
  Award,
  Timer
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Category, Restaurant, SpecialOffer } from '@shared/schema';

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [clickCount, setClickCount] = useState(0);
  const [showAdminButtons, setShowAdminButtons] = useState(false);

  // نظام الـ 4 نقرات
  useEffect(() => {
    if (clickCount === 4) {
      setShowAdminButtons(true);
    }
    
    // إعادة تعيين العداد بعد 3 ثوانٍ
    const timer = setTimeout(() => {
      if (clickCount > 0 && clickCount < 4) {
        setClickCount(0);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [clickCount]);

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
  };

  // جلب البيانات
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: restaurants } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants', { categoryId: selectedCategory, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('categoryId', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/restaurants?${params}`);
      return response.json();
    },
  });

  const { data: specialOffers } = useQuery<SpecialOffer[]>({
    queryKey: ['/api/special-offers'],
  });

  const filteredRestaurants = restaurants?.filter(restaurant => {
    const matchesSearch = !searchQuery || 
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || restaurant.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }) || [];

  const handleRestaurantClick = (restaurantId: string) => {
    setLocation(`/restaurant/${restaurantId}`);
  };

  const parseDecimal = (value: string | null): number => {
    if (!value) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header - Modern design matching reference */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Right side - Menu and User */}
            <div className="flex items-center gap-4">
              <button className="p-2">
                <Menu className="h-6 w-6" />
              </button>
              <button className="p-2">
                <User className="h-6 w-6" />
              </button>
              <button className="p-2">
                <Search className="h-6 w-6" />
              </button>
            </div>

            {/* Center - Title and Location */}
            <div className="text-center" onClick={handleLogoClick}>
              <h1 className="text-lg font-bold">توصيل أول بدن</h1>
              <div className="flex items-center justify-center gap-1 text-sm opacity-90">
                <MapPin className="h-4 w-4" />
                <span>اختيار العنوان</span>
              </div>
              
              {/* Admin access indicators */}
              {clickCount > 0 && clickCount < 4 && (
                <div className="flex gap-1 justify-center mt-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i < clickCount ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Left side - Location pin */}
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>

            {/* Admin buttons (hidden by default) */}
            {showAdminButtons && (
              <div className="absolute top-full left-4 mt-2 bg-white rounded-lg shadow-lg p-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/admin-login')}
                  className="text-gray-700"
                >
                  <Settings className="h-4 w-4 ml-1" />
                  لوحة التحكم
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/driver-login')}
                  className="text-gray-700"
                >
                  <Truck className="h-4 w-4 ml-1" />
                  تطبيق السائق
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Timing Banner - Similar to reference */}
      <div className="bg-gray-200 py-2">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="bg-orange-500 text-white px-4 py-2 rounded-full inline-flex items-center gap-2 text-sm">
            <Timer className="h-4 w-4" />
            <span>أوقات الدوام من الساعة 11:00 من صباحا حتى 11:09 م</span>
            <span className="bg-white/20 px-2 py-1 rounded text-xs">مغلق</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Category Grid - Matching reference design */}
        <section className="mb-6">
          <div className="grid grid-cols-4 gap-4">
            {/* Category cards with icons like reference */}
            <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCategory('meat')}>
              <div className="w-12 h-12 mx-auto mb-2 bg-red-100 rounded-xl flex items-center justify-center">
                <Beef className="h-6 w-6 text-red-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-700">اللحوم</h4>
            </Card>
            
            <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCategory('sweets')}>
              <div className="w-12 h-12 mx-auto mb-2 bg-pink-100 rounded-xl flex items-center justify-center">
                <Cookie className="h-6 w-6 text-pink-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-700">الحلويات</h4>
            </Card>
            
            <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCategory('restaurants')}>
              <div className="w-12 h-12 mx-auto mb-2 bg-orange-100 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-700">المطاعم</h4>
            </Card>
            
            <Card className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCategory('all')}>
              <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-xl flex items-center justify-center">
                <Menu className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-700">كل التصنيفات</h4>
            </Card>
          </div>
        </section>

        {/* Promotional Banners - Like reference image */}
        <section className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Banner - عرض خاص */}
            <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
              <div className="relative h-40 bg-gradient-to-br from-orange-400 to-orange-600 p-6 text-white">
                <div className="absolute top-4 left-4 bg-white/20 px-3 py-1 rounded-full text-sm">
                  عرض خاص
                </div>
                <div className="absolute bottom-4 right-4">
                  <h3 className="text-xl font-bold mb-1">توفير يصل إلى 50%</h3>
                  <p className="text-sm opacity-90">على جميع أطباق اليوم</p>
                  <p className="text-xs mt-2 bg-white/20 inline-block px-2 py-1 rounded">
                    صالح حتى 15.000 د
                  </p>
                </div>
              </div>
            </Card>

            {/* Right Banner - أطباق مميزة */}
            <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
              <div className="relative h-40 bg-gradient-to-br from-green-400 to-green-600 p-6 text-white">
                <div className="absolute top-4 left-4 bg-white/20 px-3 py-1 rounded-full text-sm">
                  1,000,000
                </div>
                <div className="absolute bottom-4 right-4">
                  <h3 className="text-xl font-bold mb-1">كل العروض</h3>
                  <p className="text-sm opacity-90">الاطباق الأميركية</p>
                  <p className="text-xs mt-2 bg-white/20 inline-block px-2 py-1 rounded">
                    متاح حتى 15.000 د
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Restaurant Section with Tab Navigation */}
        <section>
          {/* Tab Navigation - Similar to reference */}
          <div className="mb-6">
            <div className="flex border-b border-gray-200">
              <button 
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  selectedCategory === 'popular' 
                    ? 'border-orange-500 text-orange-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setSelectedCategory('popular')}
              >
                المفضلة
              </button>
              <button 
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  selectedCategory === 'nearest' 
                    ? 'border-orange-500 text-orange-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setSelectedCategory('nearest')}
              >
                الجديدة
              </button>
              <button 
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  selectedCategory === 'offers' 
                    ? 'border-orange-500 text-orange-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setSelectedCategory('offers')}
              >
                الأقرب
              </button>
              <button 
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  selectedCategory === 'all' 
                    ? 'border-orange-500 text-orange-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setSelectedCategory('all')}
              >
                الكل
              </button>
            </div>
          </div>

          {/* Restaurant Cards - Matching reference design */}
          <div className="space-y-4">
            {/* Sample restaurants since database is empty */}
            {[
              {
                id: '1',
                name: 'المراسيم',
                category: 'دولة كاليكس - المنصورة',
                rating: 5,
                image: null,
                deliveryTime: '30-45 دقيقة',
                deliveryFee: 'مجاني',
                badge: 'مغلق'
              },
              {
                id: '2', 
                name: 'مطاعم ومطابخ الطويل',
                category: 'دولة السيئينة',
                rating: 5,
                image: null,
                deliveryTime: '25-40 دقيقة',
                deliveryFee: 'مجاني',
                badge: 'مغلق'
              },
              {
                id: '3',
                name: 'مطعم الشرق الأوسط',
                category: 'الحديث (عدن)',
                rating: 5,
                image: null,
                deliveryTime: '20-35 دقيقة',
                deliveryFee: 'مجاني',
                badge: 'مغلق'
              },
              {
                id: '4',
                name: 'مطعم شواطئ عدن',
                category: 'البساتية',
                rating: 4,
                image: null,
                deliveryTime: '30-50 دقيقة',
                deliveryFee: 'مجاني',
                badge: 'مغلق'
              }
            ].map((restaurant) => (
              <Card 
                key={restaurant.id}
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleRestaurantClick(restaurant.id)}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Restaurant Image */}
                    <div className="w-20 h-20 bg-gray-200 flex-shrink-0 flex items-center justify-center">
                      {restaurant.image ? (
                        <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                      ) : (
                        <UtensilsCrossed className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Restaurant Info */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{restaurant.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{restaurant.category}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{restaurant.deliveryTime}</span>
                            <span>•</span>
                            <span>خط التسعين</span>
                          </div>
                        </div>
                        
                        {/* Rating and Badge */}
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-sm font-medium">{restaurant.rating}</span>
                            {[...Array(restaurant.rating)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                            ))}
                          </div>
                          <Badge 
                            className={`text-xs ${
                              restaurant.badge === 'مغلق' 
                                ? 'bg-red-600 text-white' 
                                : 'bg-green-600 text-white'
                            }`}
                          >
                            {restaurant.badge}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-3">
                        <Button 
                          size="sm" 
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 text-xs"
                        >
                          مغلق
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="p-2"
                        >
                          <Heart className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Empty state for actual restaurants when database is populated */}
            {filteredRestaurants.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>لا توجد مطاعم متاحة في الوقت الحالي</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">السريع ون</h3>
              </div>
              <p className="text-gray-400">
                أفضل تطبيق توصيل طعام في اليمن. نوصل لك طعامك المفضل بسرعة وأمان.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">روابط سريعة</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">من نحن</a></li>
                <li><a href="#" className="hover:text-white transition-colors">اتصل بنا</a></li>
                <li><a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a></li>
                <li><a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">تواصل معنا</h4>
              <div className="space-y-2 text-gray-400">
                <p>📞 +967 1 234 567</p>
                <p>📧 info@sareeone.com</p>
                <p>📍 صنعاء، اليمن</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 السريع ون. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}