import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock, Heart } from 'lucide-react';
import type { Restaurant } from '@shared/schema';
import { getRestaurantStatus } from '../utils/restaurantHours';
import { useUiSettings } from '@/context/UiSettingsContext';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
}

export default function RestaurantCard({ restaurant, onClick }: RestaurantCardProps) {
  const status = getRestaurantStatus(restaurant);
  const { isFeatureEnabled } = useUiSettings();
  
  return (
    <Card 
      className={`overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer ${!status.isOpen ? 'opacity-75' : ''}`}
      onClick={onClick}
      data-testid={`restaurant-card-${restaurant.id}`}
    >
      <CardContent className="p-0">
        <div className="flex items-center">
          {/* Restaurant Logo/Image */}
          <div className="w-16 h-16 flex-shrink-0 relative">
            <img
              src={restaurant.image || '/placeholder-restaurant.png'}
              alt={restaurant.name}
              className="w-full h-full object-cover rounded-lg m-2"
            />
          </div>
          
          {/* Restaurant Info */}
          <div className="flex-1 p-3">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-bold text-foreground text-sm" data-testid={`restaurant-name-${restaurant.id}`}>
                {restaurant.name}
              </h4>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Add to favorites logic here
                  }}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Restaurant description - compact */}
            {restaurant.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                {restaurant.description} - خط النسيمين
              </p>
            )}
            
            {/* Rating and Status Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Rating */}
                {isFeatureEnabled('show_ratings') && (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < Math.floor(Number(restaurant.rating) || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Delivery Time */}
                {isFeatureEnabled('show_delivery_time') && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{restaurant.deliveryTime}</span>
                  </div>
                )}
              </div>
              
              {/* Status Badge */}
              <Badge 
                variant={status.isOpen ? "default" : "destructive"}
                className={`text-xs px-2 py-1 ${
                  status.isOpen 
                    ? "bg-green-100 text-green-800 hover:bg-green-100" 
                    : "bg-red-100 text-red-800 hover:bg-red-100"
                }`}
                data-testid={`restaurant-status-${restaurant.id}`}
              >
                {status.isOpen ? 'مفتوح' : 'مغلق'}
              </Badge>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="p-3">
            <Button
              variant="outline"
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 text-xs px-3 py-1"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              مغلق
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}