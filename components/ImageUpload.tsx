import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  maxSize?: number; // في الميجابايت
  accept?: string;
}

export default function ImageUpload({
  value,
  onChange,
  placeholder = "اختر صورة...",
  maxSize = 10,
  accept = "image/*"
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // التحقق من حجم الملف
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "حجم الملف كبير جداً",
        description: `يجب أن يكون حجم الملف أقل من ${maxSize} ميجابايت`
      });
      return;
    }

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "نوع ملف غير مدعوم",
        description: "يجب أن يكون الملف صورة"
      });
      return;
    }

    setIsUploading(true);

    try {
      // إنشاء preview محلي
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // رفع الملف إلى Supabase
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onChange(result.data.publicUrl);
        setPreview(result.data.publicUrl);
        toast({
          title: "تم رفع الصورة بنجاح",
          description: "تم حفظ الصورة في قاعدة البيانات"
        });
      } else {
        throw new Error(result.message || 'فشل في رفع الصورة');
      }
    } catch (error: any) {
      console.error('خطأ في رفع الصورة:', error);
      toast({
        variant: "destructive",
        title: "فشل في رفع الصورة",
        description: error.message || "حدث خطأ أثناء رفع الصورة"
      });
      setPreview(value || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <Input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={accept}
        className="hidden"
        disabled={isUploading}
      />

      {preview ? (
        <Card className="relative">
          <CardContent className="p-4">
            <div className="relative group">
              <img
                src={preview}
                alt="معاينة الصورة"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleClick}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    تغيير
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={handleRemove}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4 mr-1" />
                    حذف
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card 
          className="border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors"
          onClick={handleClick}
        >
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              {isUploading ? (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">جاري رفع الصورة...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{placeholder}</p>
                    <p className="text-xs text-muted-foreground">
                      اسحب وأفلت الصورة هنا أو انقر للاختيار
                    </p>
                    <p className="text-xs text-muted-foreground">
                      الحد الأقصى للحجم: {maxSize} ميجابايت
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}