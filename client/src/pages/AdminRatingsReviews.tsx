import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Star, MessageSquare, Filter, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { OrderRating, Restaurant } from '@shared/schema';

export function AdminRatingsReviews() {
  const [, setLocation] = useLocation();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  // Fetch restaurants
  const { data: restaurants } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants'],
  });

  // Fetch ratings for selected restaurant
  const { data: ratings, isLoading } = useQuery<OrderRating[]>({
    queryKey: [`/api/restaurants/${selectedRestaurantId}/ratings`],
    enabled: !!selectedRestaurantId,
  });

  // Fetch all ratings if no restaurant selected
  const { data: allRatings, isLoading: allRatingsLoading } = useQuery<OrderRating[]>({
    queryKey: ['/api/orders/ratings'],
    enabled: !selectedRestaurantId,
  });

  const currentRatings = selectedRestaurantId ? ratings : allRatings;
  const currentLoading = selectedRestaurantId ? isLoading : allRatingsLoading;

  // Filter ratings based on rating filter
  const filteredRatings = currentRatings?.filter(rating => {
    if (ratingFilter === 'all') return true;
    const avgRating = (rating.foodRating + rating.serviceRating + (rating.deliveryRating || 0)) / (rating.deliveryRating ? 3 : 2);
    
    switch (ratingFilter) {
      case '5': return avgRating >= 4.5;
      case '4': return avgRating >= 3.5 && avgRating < 4.5;
      case '3': return avgRating >= 2.5 && avgRating < 3.5;
      case '2': return avgRating >= 1.5 && avgRating < 2.5;
      case '1': return avgRating < 1.5;
      default: return true;
    }
  }) || [];

  // Calculate statistics
  const stats = {
    total: currentRatings?.length || 0,
    average: currentRatings?.length ? 
      currentRatings.reduce((sum, r) => {
        const avg = (r.foodRating + r.serviceRating + (r.deliveryRating || 0)) / (r.deliveryRating ? 3 : 2);
        return sum + avg;
      }, 0) / currentRatings.length : 0,
    withComments: currentRatings?.filter(r => r.comment && r.comment.trim() !== '').length || 0
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'غير محدد';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getAverageRating = (rating: OrderRating) => {
    return (rating.foodRating + rating.serviceRating + (rating.deliveryRating || 0)) / (rating.deliveryRating ? 3 : 2);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-100 text-green-700';
    if (rating >= 3.5) return 'bg-blue-100 text-blue-700';
    if (rating >= 2.5) return 'bg-yellow-100 text-yellow-700';
    if (rating >= 1.5) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/admin')}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">التقييمات والمراجعات</h1>
          <p className="text-muted-foreground">عرض وإدارة تقييمات العملاء</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            الفلاتر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="restaurant">المطعم</Label>
              <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المطاعم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع المطاعم</SelectItem>
                  {restaurants?.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="rating">التقييم</Label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التقييمات</SelectItem>
                  <SelectItem value="5">5 نجوم (ممتاز)</SelectItem>
                  <SelectItem value="4">4 نجوم (جيد جداً)</SelectItem>
                  <SelectItem value="3">3 نجوم (جيد)</SelectItem>
                  <SelectItem value="2">2 نجمة (مقبول)</SelectItem>
                  <SelectItem value="1">1 نجمة (ضعيف)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي التقييمات</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">متوسط التقييم</p>
                <p className="text-2xl font-bold">{stats.average.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">مع تعليقات</p>
                <p className="text-2xl font-bold">{stats.withComments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ratings List */}
      <Card>
        <CardHeader>
          <CardTitle>التقييمات والمراجعات</CardTitle>
        </CardHeader>
        <CardContent>
          {currentLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRatings.length === 0 ? (
            <p className="text-center text-muted-foreground p-8">لا توجد تقييمات</p>
          ) : (
            <div className="space-y-4">
              {filteredRatings.map((rating) => {
                const avgRating = getAverageRating(rating);
                
                return (
                  <div key={rating.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getRatingColor(avgRating)}>
                            {avgRating.toFixed(1)} نجمة
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            رقم الطلب: {rating.orderId}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(rating.createdAt)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">الطعام</p>
                            <div className="flex items-center gap-2">
                              <div className="flex">{renderStars(rating.foodRating)}</div>
                              <span className="text-sm">{rating.foodRating}/5</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">الخدمة</p>
                            <div className="flex items-center gap-2">
                              <div className="flex">{renderStars(rating.serviceRating)}</div>
                              <span className="text-sm">{rating.serviceRating}/5</span>
                            </div>
                          </div>
                          
                          {rating.deliveryRating && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">التوصيل</p>
                              <div className="flex items-center gap-2">
                                <div className="flex">{renderStars(rating.deliveryRating)}</div>
                                <span className="text-sm">{rating.deliveryRating}/5</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {rating.comment && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-muted-foreground mb-1">تعليق العميل:</p>
                            <p className="text-sm">{rating.comment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      تم التقييم في: {formatDate(rating.createdAt)}
                      {!rating.isPublic && (
                        <Badge variant="secondary" className="text-xs">
                          غير عام
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminRatingsReviews;