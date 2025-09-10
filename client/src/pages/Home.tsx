import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Search, 
  Bell, 
  User, 
  Clock, 
  Beef, 
  Cookie, 
  UtensilsCrossed, 
  Star, 
  Heart,
  Plus,
  Menu,
  ShoppingBag,
  Building2,
  Stethoscope,
  Settings
} from 'lucide-react';
import type { Restaurant } from '@shared/schema';
import TimingBanner from '@/components/TimingBanner';

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants'],
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });

  // فلترة المطاعم حسب التصنيف المحدد
  const filteredRestaurants = restaurants?.filter(restaurant => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'restaurants') return restaurant.categoryId !== null;
    if (selectedCategory === 'meat') return restaurant.categoryId === 'meat-category';
    if (selectedCategory === 'pastries') return restaurant.categoryId === 'pastries-category';
    return restaurant.categoryId === selectedCategory;
  }) || [];

  const handleRestaurantClick = (restaurantId: string) => {
    setLocation(`/restaurant/${restaurantId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Timing Banner - Dynamic from admin settings */}
      <TimingBanner />

      {/* Main Content */}
      <main className="p-4">
        {/* Category Grid */}
        <section className="mb-6">
          <div className="grid grid-cols-4 gap-3">
            <div className={`text-center cursor-pointer ${
              selectedCategory === 'meat' ? 'transform scale-105' : ''
            }`} onClick={() => setSelectedCategory('meat')}>
              <div className="w-16 h-16 mx-auto mb-2 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100">
                <Beef className="h-8 w-8 text-red-500" />
              </div>
              <h4 className="text-xs font-medium text-gray-700">اللحوم</h4>
            </div>
            
            <div className={`text-center cursor-pointer ${
              selectedCategory === 'pastries' ? 'transform scale-105' : ''
            }`} onClick={() => setSelectedCategory('pastries')}>
              <div className="w-16 h-16 mx-auto mb-2 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100">
                <Cookie className="h-8 w-8 text-yellow-600" />
              </div>
              <h4 className="text-xs font-medium text-gray-700">الطويلات</h4>
            </div>
            
            <div className={`text-center cursor-pointer ${
              selectedCategory === 'restaurants' ? 'transform scale-105' : ''
            }`} onClick={() => setSelectedCategory('restaurants')}>
              <div className="w-16 h-16 mx-auto mb-2 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100">
                <UtensilsCrossed className="h-8 w-8 text-orange-500" />
              </div>
              <h4 className="text-xs font-medium text-gray-700">المطاعم</h4>
            </div>
            
            <div className={`text-center cursor-pointer ${
              selectedCategory === 'all' ? 'transform scale-105' : ''
            }`} onClick={() => setSelectedCategory('all')}>
              <div className="w-16 h-16 mx-auto mb-2 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100">
                <Menu className="h-8 w-8 text-blue-500" />
              </div>
              <h4 className="text-xs font-medium text-gray-700">كل التصنيفات</h4>
            </div>
          </div>
        </section>

        {/* Promotional Banners */}
        <section className="mb-6">
          <div className="grid grid-cols-2 gap-3">
            {/* Special Offer Banner */}
            <div className="relative h-32 overflow-hidden rounded-2xl cursor-pointer hover:shadow-lg transition-shadow">
              <div className="absolute inset-0 orange-gradient p-4 text-white">
                <div className="absolute top-3 left-3 bg-white/20 px-2 py-1 rounded-full text-xs">
                  عرض خاص
                </div>
                <div className="absolute bottom-3 right-3">
                  <h3 className="text-sm font-bold mb-1">عرض مجاني يصل</h3>
                  <p className="text-xs opacity-90">عبر التطبيق</p>
                  <p className="text-xs mt-1 bg-white/20 inline-block px-2 py-1 rounded">
                    صالح حتى 15.000 د
                  </p>
                </div>
              </div>
            </div>

            {/* Million Offer Banner */}
            <div className="relative h-32 overflow-hidden rounded-2xl cursor-pointer hover:shadow-lg transition-shadow">
              <div className="absolute inset-0 brown-gradient p-4 text-white">
                <div className="absolute top-3 left-3 bg-white/20 px-2 py-1 rounded-full text-xs">
                  1,000,000
                </div>
                <div className="absolute bottom-3 right-3">
                  <h3 className="text-sm font-bold mb-1">كل العروض</h3>
                  <p className="text-xs opacity-90">طعام مميز</p>
                  <p className="text-xs mt-1 bg-white/20 inline-block px-2 py-1 rounded">
                    صالح حتى 25.000 د
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Restaurant Section with Tab Navigation */}
        <section>
          {/* Tab Navigation */}
          <div className="mb-4">
            <div className="flex border-b border-gray-200">
              <button 
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  selectedCategory === 'popular' 
                    ? 'border-red-500 text-red-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setSelectedCategory('popular')}
              >
                المفضلة
              </button>
              <button 
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  selectedCategory === 'newest' 
                    ? 'border-red-500 text-red-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setSelectedCategory('newest')}
              >
                الجديدة
              </button>
              <button 
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  selectedCategory === 'nearest' 
                    ? 'border-red-500 text-red-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setSelectedCategory('nearest')}
              >
                الأقرب
              </button>
              <button 
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  selectedCategory === 'all' 
                    ? 'border-red-500 text-red-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setSelectedCategory('all')}
              >
                الكل
              </button>
            </div>
          </div>

          {/* Restaurant Cards */}
          <div className="space-y-4">
            {/* Sample restaurants matching the image design */}
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
              <div 
                key={restaurant.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleRestaurantClick(restaurant.id)}
              >
                <div className="flex p-4">
                  {/* Restaurant Logo/Image */}
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center mr-4">
                    {restaurant.image ? (
                      <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <UtensilsCrossed className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Restaurant Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{restaurant.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{restaurant.category}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>خط التسعين</span>
                        </div>
                      </div>
                      
                      {/* Rating and Actions */}
                      <div className="text-left flex flex-col items-end">
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(restaurant.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                          ))}
                          <span className="text-xs font-medium ml-1">{restaurant.rating}</span>
                        </div>
                        <Badge 
                          className={`text-xs mb-2 ${
                            restaurant.badge === 'مغلق' 
                              ? 'bg-red-600 text-white hover:bg-red-700' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {restaurant.badge}
                        </Badge>
                        <Heart className="h-4 w-4 text-gray-400 cursor-pointer hover:text-red-500" />
                      </div>
                    </div>
                    
                    {/* Bottom Action Button */}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Database restaurants when available */}
            {filteredRestaurants && filteredRestaurants.length > 0 && filteredRestaurants.map((restaurant) => (
              <div 
                key={restaurant.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleRestaurantClick(restaurant.id)}
              >
                <div className="flex p-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center mr-4">
                    {restaurant.image ? (
                      <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <UtensilsCrossed className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{restaurant.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{restaurant.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{restaurant.deliveryTime}</span>
                          <span>•</span>
                          <span>رسوم التوصيل: {restaurant.deliveryFee} ريال</span>
                        </div>
                      </div>
                      <div className="text-left flex flex-col items-end">
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-xs font-medium">{restaurant.rating}</span>
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        </div>
                        <Badge className={restaurant.isOpen ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                          {restaurant.isOpen ? 'مفتوح' : 'مغلق'}
                        </Badge>
                        <Heart className="h-4 w-4 text-gray-400 cursor-pointer hover:text-red-500 mt-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Empty state */}
            {(!filteredRestaurants || filteredRestaurants.length === 0) && !isLoading && (
              <div className="text-center py-8">
                <UtensilsCrossed className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">لا توجد مطاعم</h3>
                <p className="text-gray-500">لا توجد مطاعم متاحة في هذا التصنيف حالياً</p>
              </div>
            )}
            
            {/* Loading state */}
            {isLoading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex p-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse mr-4" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      
      {/* Interactive Bottom Banner */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 px-4 py-3 z-50">
        <div className="grid grid-cols-4 gap-2">
          <div 
            className="text-center cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors" 
            onClick={() => setLocation('/profile')}
          >
            <div className="w-10 h-10 mx-auto mb-1 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">الملف الشخصي</span>
          </div>
          
          <div 
            className="text-center cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors" 
            onClick={() => setSelectedCategory('all')}
          >
            <div className="w-10 h-10 mx-auto mb-1 bg-green-100 rounded-lg flex items-center justify-center">
              <Menu className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">كل التصنيفات</span>
          </div>
          
          <div 
            className="text-center cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors" 
            onClick={() => setSelectedCategory('restaurants')}
          >
            <div className="w-10 h-10 mx-auto mb-1 bg-orange-100 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">المطاعم</span>
          </div>
          
          <div 
            className="text-center cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors" 
            onClick={() => setLocation('/settings')}
          >
            <div className="w-10 h-10 mx-auto mb-1 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">الإعدادات</span>
          </div>
        </div>
      </div>
    </div>
  );
}
