import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Plus, Edit, Trash2, MapPin, Home, Building, Navigation } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { UserAddress, User } from '@shared/schema';

export function AdminUserAddresses() {
  const [, setLocation] = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    type: 'home' as 'home' | 'work' | 'other',
    title: '',
    address: '',
    details: '',
    latitude: '',
    longitude: '',
    isDefault: false
  });

  // Fetch users
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: false // We'll manually trigger this when needed
  });

  // Fetch user addresses
  const { data: addresses, isLoading } = useQuery<UserAddress[]>({
    queryKey: [`/api/users/${selectedUserId}/addresses`],
    enabled: !!selectedUserId,
  });

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/users/${selectedUserId}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create address');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${selectedUserId}/addresses`] });
      setShowAddForm(false);
      resetForm();
      toast({ title: 'تم إضافة العنوان بنجاح' });
    },
    onError: () => {
      toast({ title: 'فشل في إضافة العنوان', variant: 'destructive' });
    },
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/addresses/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update address');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${selectedUserId}/addresses`] });
      setEditingAddress(null);
      resetForm();
      toast({ title: 'تم تحديث العنوان بنجاح' });
    },
    onError: () => {
      toast({ title: 'فشل في تحديث العنوان', variant: 'destructive' });
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete address');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${selectedUserId}/addresses`] });
      toast({ title: 'تم حذف العنوان بنجاح' });
    },
    onError: () => {
      toast({ title: 'فشل في حذف العنوان', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'home',
      title: '',
      address: '',
      details: '',
      latitude: '',
      longitude: '',
      isDefault: false
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    };
    
    if (editingAddress) {
      updateAddressMutation.mutate({ ...dataToSubmit, id: editingAddress.id, userId: selectedUserId });
    } else {
      createAddressMutation.mutate(dataToSubmit);
    }
  };

  const startEdit = (address: UserAddress) => {
    setEditingAddress(address);
    setFormData({
      type: address.type as 'home' | 'work' | 'other',
      title: address.title,
      address: address.address,
      details: address.details || '',
      latitude: address.latitude || '',
      longitude: address.longitude || '',
      isDefault: address.isDefault
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingAddress(null);
    setShowAddForm(false);
    resetForm();
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home': return <Home className="h-4 w-4" />;
      case 'work': return <Building className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case 'home': return 'المنزل';
      case 'work': return 'العمل';
      default: return 'أخرى';
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
          toast({ title: 'تم الحصول على الموقع الحالي بنجاح' });
        },
        (error) => {
          toast({ 
            title: 'فشل في الحصول على الموقع', 
            description: 'تأكد من السماح للتطبيق بالوصول للموقع',
            variant: 'destructive' 
          });
        }
      );
    } else {
      toast({ 
        title: 'الموقع غير مدعوم', 
        description: 'متصفحك لا يدعم خدمات الموقع',
        variant: 'destructive' 
      });
    }
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
          <h1 className="text-2xl font-bold">إدارة عناوين المستخدمين</h1>
          <p className="text-muted-foreground">عرض وإدارة عناوين المستخدمين</p>
        </div>
      </div>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle>اختيار المستخدم</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userId">معرف المستخدم</Label>
              <Input
                id="userId"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                placeholder="أدخل معرف المستخدم"
              />
            </div>
            {selectedUserId && (
              <Button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingAddress(null);
                  resetForm();
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة عنوان جديد
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {selectedUserId && (showAddForm || editingAddress) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingAddress ? 'تعديل العنوان' : 'إضافة عنوان جديد'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">نوع العنوان</Label>
                  <Select value={formData.type} onValueChange={(value: 'home' | 'work' | 'other') => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">المنزل</SelectItem>
                      <SelectItem value="work">العمل</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="title">عنوان مختصر</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="مثال: المنزل الرئيسي"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">العنوان الكامل</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="العنوان التفصيلي"
                  required
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="details">تفاصيل إضافية</Label>
                <Textarea
                  id="details"
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="تفاصيل إضافية مثل رقم الشقة، لون المبنى، إلخ"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="latitude">خط العرض</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="24.7136"
                  />
                </div>
                
                <div>
                  <Label htmlFor="longitude">خط الطول</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="46.6753"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    className="gap-2 w-full"
                  >
                    <Navigation className="h-4 w-4" />
                    الموقع الحالي
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                />
                <Label htmlFor="isDefault">العنوان الافتراضي</Label>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                >
                  {editingAddress ? 'تحديث' : 'حفظ'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Addresses List */}
      {selectedUserId && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : addresses?.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">لا توجد عناوين لهذا المستخدم</p>
              </CardContent>
            </Card>
          ) : (
            addresses?.map((address) => (
              <Card key={address.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getAddressIcon(address.type)}
                        <h3 className="font-semibold text-lg">{address.title}</h3>
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                          {getAddressTypeLabel(address.type)}
                        </span>
                        {address.isDefault && (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            افتراضي
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-2">{address.address}</p>
                      {address.details && (
                        <p className="text-sm text-muted-foreground mb-2">{address.details}</p>
                      )}
                      {address.latitude && address.longitude && (
                        <p className="text-xs text-muted-foreground">
                          الموقع: {address.latitude}, {address.longitude}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(address)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذا العنوان؟')) {
                            deleteAddressMutation.mutate(address.id);
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
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AdminUserAddresses;