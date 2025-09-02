import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock } from 'lucide-react';
import type { Restaurant } from '@shared/schema';
import { getRestaurantStatus } from '../utils/restaurantHours';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
}

export default function RestaurantCard({ restaurant, onClick }: RestaurantCardProps) {
  const status = getRestaurantStatus(restaurant);
  
  return (
    <Card 
      className={`overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer ${!status.isOpen ? 'opacity-75' : ''}`}
      onClick={onClick}
      data-testid={`restaurant-card-${restaurant.id}`}
    >
      <img
        src={restaurant.image}
        alt={restaurant.name}
        className="w-full h-48 object-cover"
      />
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-foreground" data-testid={`restaurant-name-${restaurant.id}`}>
            {restaurant.name}
          </h4>
          <Badge 
            variant={status.isOpen ? "default" : "destructive"}
            className={status.statusColor === 'green' ? "bg-green-100 text-green-800 hover:bg-green-100" : 
                      status.statusColor === 'yellow' ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : ""}
            data-testid={`restaurant-status-${restaurant.id}`}
          >
            {status.isOpen ? 'مفتوح' : 'مغلق'}
          </Badge>
        </div>
        
        {/* Restaurant status message */}
        <div className="mb-2">
          <p className={`text-xs ${status.statusColor === 'green' ? 'text-green-600' : 
                                    status.statusColor === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>
            {status.message}
          </p>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span data-testid={`restaurant-rating-${restaurant.id}`}>{restaurant.rating}</span>
            <span>({restaurant.reviewCount} تقييم)</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span data-testid={`restaurant-delivery-time-${restaurant.id}`}>{restaurant.deliveryTime}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            الحد الأدنى: {restaurant.minimumOrder} ريال
          </span>
          <span className="text-sm text-primary font-medium">
            رسوم التوصيل: {restaurant.deliveryFee} ريال
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
