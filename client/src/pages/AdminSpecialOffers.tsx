import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Plus, Edit, Trash2, Save, X, Percent, Calendar, Store } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Restaurant } from '@shared/schema';

export function AdminSpecialOffers() {
  const [, setLocation] = useLocation();
  const [editingOffer, setEditingOffer] = useState<any | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    validFrom: '',
    validUntil: '',
    restaurantId: '',
    isActive: true,
    usageLimit: '',
    currentUsage: '0'
  });

  // Fetch special offers
  const { data: offers, isLoading } = useQuery<any[]>({
    queryKey: ['/api/special-offers'],
  });

  // Fetch restaurants for selection
  const { data: restaurants } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants'],
  });

  // Create offer mutation
  const createOfferMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/special-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create offer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/special-offers'] });
      setShowAddForm(false);
      resetForm();
      toast({ title: 'تم إنشاء العرض بنجاح' });
    },
    onError: () => {
      toast({ title: 'فشل في إنشاء العرض', variant: 'destructive' });
    },
  });

  // Update offer mutation
  const updateOfferMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/special-offers/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update offer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/special-offers'] });
      setEditingOffer(null);
      resetForm();
      toast({ title: 'تم تحديث العرض بنجاح' });
    },
    onError: () => {
      toast({ title: 'فشل في تحديث العرض', variant: 'destructive' });
    },
  });

  // Delete offer mutation
  const deleteOfferMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/special-offers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete offer');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/special-offers'] });
      toast({ title: 'تم حذف العرض بنجاح' });
    },
    onError: () => {
      toast({ title: 'فشل في حذف العرض', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmount: '',
      maxDiscountAmount: '',
      validFrom: '',
      validUntil: '',
      restaurantId: '',
      isActive: true,
      usageLimit: '',
      currentUsage: '0'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      discountValue: parseFloat(formData.discountValue) || 0,
      minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
      maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      currentUsage: parseInt(formData.currentUsage) || 0,
      validFrom: new Date(formData.validFrom),
      validUntil: new Date(formData.validUntil),
      restaurantId: formData.restaurantId || null,
    };
    
    if (editingOffer) {
      updateOfferMutation.mutate({ ...dataToSubmit, id: editingOffer.id });
    } else {
      createOfferMutation.mutate(dataToSubmit);
    }
  };

  const startEdit = (offer: SpecialOffer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description || '',
      discountType: offer.discountType as 'percentage' | 'fixed',
      discountValue: offer.discountValue.toString(),
      minOrderAmount: offer.minOrderAmount?.toString() || '',
      maxDiscountAmount: offer.maxDiscountAmount?.toString() || '',
      validFrom: new Date(offer.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(offer.validUntil).toISOString().slice(0, 16),
      restaurantId: offer.restaurantId || '',
      isActive: offer.isActive,
      usageLimit: offer.usageLimit?.toString() || '',
      currentUsage: offer.currentUsage?.toString() || '0'
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingOffer(null);
    setShowAddForm(false);
    resetForm();
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDiscountText = (offer: SpecialOffer) => {
    if (offer.discountType === 'percentage') {
      return `${offer.discountValue}%`;
    } else {
      return `${offer.discountValue} ريال`;
    }
  };

  const isOfferActive = (offer: SpecialOffer) => {
    const now = new Date();
    const validFrom = new Date(offer.validFrom);
    const validUntil = new Date(offer.validUntil);
    return offer.isActive && now >= validFrom && now <= validUntil;
  };

  const getOfferStatus = (offer: SpecialOffer) => {
    if (!offer.isActive) return { text: 'غير نشط', color: 'bg-gray-100 text-gray-700' };
    
    const now = new Date();
    const validFrom = new Date(offer.validFrom);
    const validUntil = new Date(offer.validUntil);
    
    if (now < validFrom) return { text: 'قريباً', color: 'bg-blue-100 text-blue-700' };
    if (now > validUntil) return { text: 'منتهي الصلاحية', color: 'bg-red-100 text-red-700' };
    return { text: 'نشط', color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/admin')}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إدارة العروض الخاصة</h1>
            <p className="text-muted-foreground">إنشاء وإدارة عروض الخصم والكوبونات</p>
          </div>
        </div>
        
        <Button
          onClick={() => {
            setShowAddForm(true);
            setEditingOffer(null);
            resetForm();
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          إضافة عرض جديد
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingOffer) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">عنوان العرض</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="مثال: خصم 20% على جميع الطلبات"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="restaurantId">المطعم (اختياري)</Label>
                  <Select value={formData.restaurantId} onValueChange={(value) => setFormData({ ...formData, restaurantId: value })}>
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
              </div>

              <div>
                <Label htmlFor="description">وصف العرض</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف تفصيلي للعرض"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="discountType">نوع الخصم</Label>
                  <Select value={formData.discountType} onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, discountType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                      <SelectItem value="fixed">مبلغ ثابت (ريال)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="discountValue">قيمة الخصم</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === 'percentage' ? '20' : '50'}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="minOrderAmount">الحد الأدنى للطلب</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    step="0.01"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="maxDiscountAmount">الحد الأقصى للخصم</Label>
                  <Input
                    id="maxDiscountAmount"
                    type="number"
                    step="0.01"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    placeholder="50"
                  />
                </div>

                <div>
                  <Label htmlFor="usageLimit">حد الاستخدام</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="100"
                  />
                </div>

                <div>
                  <Label htmlFor="currentUsage">الاستخدام الحالي</Label>
                  <Input
                    id="currentUsage"
                    type="number"
                    value={formData.currentUsage}
                    onChange={(e) => setFormData({ ...formData, currentUsage: e.target.value })}
                    placeholder="0"
                    disabled={!editingOffer}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validFrom">تاريخ البداية</Label>
                  <Input
                    id="validFrom"
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="validUntil">تاريخ الانتهاء</Label>
                  <Input
                    id="validUntil"
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">نشط</Label>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createOfferMutation.isPending || updateOfferMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingOffer ? 'تحديث' : 'حفظ'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={cancelEdit}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Offers List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : offers?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">لا توجد عروض خاصة</p>
            </CardContent>
          </Card>
        ) : (
          offers?.map((offer) => {
            const status = getOfferStatus(offer);
            const restaurant = restaurants?.find(r => r.id === offer.restaurantId);
            
            return (
              <Card key={offer.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{offer.title}</h3>
                        <Badge className={status.color}>
                          {status.text}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Percent className="h-3 w-3" />
                          {getDiscountText(offer)}
                        </Badge>
                      </div>
                      
                      {offer.description && (
                        <p className="text-muted-foreground mb-3">{offer.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">المطعم</p>
                          <p>{restaurant ? restaurant.name : 'جميع المطاعم'}</p>
                        </div>
                        
                        <div>
                          <p className="font-medium text-muted-foreground">فترة الصلاحية</p>
                          <p>{formatDate(offer.validFrom)} - {formatDate(offer.validUntil)}</p>
                        </div>
                        
                        <div>
                          <p className="font-medium text-muted-foreground">الحد الأدنى للطلب</p>
                          <p>{offer.minOrderAmount ? `${offer.minOrderAmount} ريال` : 'بدون حد أدنى'}</p>
                        </div>
                        
                        <div>
                          <p className="font-medium text-muted-foreground">الاستخدام</p>
                          <p>
                            {offer.currentUsage || 0}
                            {offer.usageLimit ? ` / ${offer.usageLimit}` : ' / غير محدود'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(offer)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذا العرض؟')) {
                            deleteOfferMutation.mutate(offer.id);
                          }
                        }}
                        className="gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminSpecialOffers;