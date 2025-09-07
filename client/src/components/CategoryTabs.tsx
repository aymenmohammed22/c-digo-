import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Beef, Cake, UtensilsCrossed, Grid3x3 } from 'lucide-react';
import type { Category } from '@shared/schema';
import { useUiSettings } from '@/context/UiSettingsContext';

interface CategoryTabsProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

// Fixed categories with icons to match the Arabic design
const fixedCategories = [
  {
    id: 'meat',
    name: 'اللحوم',
    icon: Beef,
    color: 'from-red-100 to-red-50 border-red-200',
    iconColor: 'text-red-600'
  },
  {
    id: 'sweets',
    name: 'الحلويات',
    icon: Cake,
    color: 'from-pink-100 to-pink-50 border-pink-200',
    iconColor: 'text-pink-600'
  },
  {
    id: 'restaurants',
    name: 'المطاعم',
    icon: UtensilsCrossed,
    color: 'from-orange-100 to-orange-50 border-orange-200',
    iconColor: 'text-orange-600'
  },
  {
    id: null,
    name: 'كل التصنيفات',
    icon: Grid3x3,
    color: 'from-blue-100 to-blue-50 border-blue-200',
    iconColor: 'text-blue-600'
  }
];

export default function CategoryTabs({ selectedCategory, onCategoryChange }: CategoryTabsProps) {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  const { isFeatureEnabled } = useUiSettings();

  // لا تعرض المكون إذا كان معطل
  if (!isFeatureEnabled('show_categories')) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="px-4 mb-6">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-muted rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mb-6">
      <div className="grid grid-cols-4 gap-3">
        {fixedCategories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Card 
              key={category.id || 'all'} 
              className={`cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'ring-2 ring-primary ring-offset-2 shadow-lg' 
                  : 'hover:shadow-md'
              } bg-gradient-to-br ${category.color}`}
              onClick={() => onCategoryChange(category.id)}
            >
              <CardContent className="p-3 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-2 rounded-full bg-white/70 ${category.iconColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 leading-tight">
                    {category.name}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}