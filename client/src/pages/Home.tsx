import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Truck, Clock, Star, Zap, Percent } from 'lucide-react';
import CategoryTabs from '../components/CategoryTabs';
import RestaurantCard from '../components/RestaurantCard';
import type { Restaurant } from '@shared/schema';

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants', ...(selectedCategory ? [`?categoryId=${selectedCategory}`] : [])],
  });

  const handleRestaurantClick = (restaurantId: string) => {
    setLocation(`/restaurant/${restaurantId}`);
  };

  return (
    <div>
      {/* Special Offers */}
      <section className="mb-6">
        <div className="px-4 grid grid-cols-2 gap-3">
          {/* عرض خاص - برجر */}
          <Card className="relative overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <div className="relative h-32 bg-gradient-to-br from-orange-400 to-orange-600">
                <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">
                  عرض خاص
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
                  <div className="text-xs opacity-90">عرض من كل شيء بخصم يصل حتى</div>
                  <div className="text-xs font-bold">15,000 ريال</div>
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center">
                    🍔
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* كل العروض */}
          <Card className="relative overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <div className="relative h-32 bg-gradient-to-br from-green-500 to-green-700">
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                  1,000,000
                </div>
                <div className="absolute top-8 left-2 text-white text-xs">
                  يمني
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
                  <div className="text-xs font-bold">الشواني التركية</div>
                </div>
                <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  كل العروض
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center">
                    🥩
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Category Tabs */}
      <CategoryTabs 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Restaurant List */}
      <section className="px-4 space-y-4">
        <h3 className="text-lg font-bold text-foreground mb-4">المطاعم القريبة منك</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="w-full h-48 bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : restaurants?.length ? (
          restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onClick={() => handleRestaurantClick(restaurant.id)}
            />
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>لا توجد مطاعم متاحة في هذا التصنيف</p>
          </div>
        )}
      </section>
    </div>
  );
}
