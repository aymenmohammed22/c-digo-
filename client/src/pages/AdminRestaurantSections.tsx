import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { RestaurantSection, Restaurant } from '@shared/schema';

interface AdminRestaurantSectionsProps {
  restaurantId: string;
}

export function AdminRestaurantSections({ restaurantId }: AdminRestaurantSectionsProps) {
  const [, setLocation] = useLocation();
  const [editingSection, setEditingSection] = useState<RestaurantSection | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    sortOrder: 0
  });

  // Fetch restaurant info
  const { data: restaurant } = useQuery<Restaurant>({
    queryKey: [`/api/restaurants/${restaurantId}`],
  });

  // Fetch restaurant sections
  const { data: sections, isLoading } = useQuery<RestaurantSection[]>({
    queryKey: [`/api/restaurants/${restaurantId}/sections`],
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/restaurant-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, restaurantId }),
      });
      if (!response.ok) throw new Error('Failed to create section');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/sections`] });
      setShowAddForm(false);
      resetForm();
      toast({ title: 'تم إنشاء القسم بنجاح' });
    },
    onError: () => {
      toast({ title: 'فشل في إنشاء القسم', variant: 'destructive' });
    },
  });

  // Update section mutation
  const updateSectionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/restaurant-sections/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update section');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/sections`] });
      setEditingSection(null);
      resetForm();
      toast({ title: 'تم تحديث القسم بنجاح' });
    },
    onError: () => {
      toast({ title: 'فشل في تحديث القسم', variant: 'destructive' });
    },
  });

  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/restaurant-sections/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete section');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/sections`] });
      toast({ title: 'تم حذف القسم بنجاح' });
    },
    onError: () => {
      toast({ title: 'فشل في حذف القسم', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      sortOrder: 0
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSection) {
      updateSectionMutation.mutate({ ...formData, id: editingSection.id });
    } else {
      createSectionMutation.mutate(formData);
    }
  };

  const startEdit = (section: RestaurantSection) => {
    setEditingSection(section);
    setFormData({
      name: section.name,
      description: section.description || '',
      isActive: section.isActive,
      sortOrder: section.sortOrder || 0
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setShowAddForm(false);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/admin/restaurants')}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">أقسام {restaurant?.name || 'المطعم'}</h1>
            <p className="text-muted-foreground">إدارة أقسام المطعم الفرعية</p>
          </div>
        </div>
        
        <Button
          onClick={() => {
            setShowAddForm(true);
            setEditingSection(null);
            resetForm();
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          إضافة قسم جديد
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingSection) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSection ? 'تعديل القسم' : 'إضافة قسم جديد'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">اسم القسم</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: المشروبات الساخنة"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="sortOrder">ترتيب العرض</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">وصف القسم</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر للقسم"
                  rows={3}
                />
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
                  disabled={createSectionMutation.isPending || updateSectionMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingSection ? 'تحديث' : 'حفظ'}
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

      {/* Sections List */}
      <div className="space-y-4">
        {sections?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">لا توجد أقسام محددة لهذا المطعم</p>
            </CardContent>
          </Card>
        ) : (
          sections?.map((section) => (
            <Card key={section.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{section.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        section.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {section.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                      {section.sortOrder !== undefined && (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                          ترتيب: {section.sortOrder}
                        </span>
                      )}
                    </div>
                    {section.description && (
                      <p className="text-muted-foreground mt-2">{section.description}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(section)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
                          deleteSectionMutation.mutate(section.id);
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
    </div>
  );
}

export default AdminRestaurantSections;