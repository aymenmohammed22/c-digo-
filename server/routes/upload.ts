// server/routes/upload.ts
import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { supabaseClient, STORAGE_BUCKET } from '../supabase';
import { decode } from 'base64-arraybuffer';
import { log } from '../viteServer';

const router = Router();

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('يجب أن يكون الملف صورة فقط'));
    }
  }
});

// Single image upload endpoint
router.post('/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: 'يرجى اختيار صورة للرفع' 
      });
    }

    log(`📤 رفع صورة: ${file.originalname} (${file.size} bytes)`);

    // Convert buffer to ArrayBuffer for Supabase
    const fileBase64 = decode(file.buffer.toString('base64'));
    
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    const filePath = `uploads/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileBase64, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      log(`❌ خطأ في رفع الصورة: ${error.message}`);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    log(`✅ تم رفع الصورة بنجاح: ${urlData.publicUrl}`);

    res.json({
      success: true,
      message: 'تم رفع الصورة بنجاح',
      data: {
        path: data.path,
        publicUrl: urlData.publicUrl,
        fileName: fileName,
        size: file.size,
        mimetype: file.mimetype
      }
    });

  } catch (error: any) {
    log(`❌ خطأ في رفع الصورة: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'فشل في رفع الصورة',
      error: error.message 
    });
  }
});

// Multiple images upload endpoint
router.post('/images', upload.array('images', 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'يرجى اختيار صورة واحدة على الأقل' 
      });
    }

    log(`📤 رفع ${files.length} صور`);

    const uploadPromises = files.map(async (file) => {
      const fileBase64 = decode(file.buffer.toString('base64'));
      const timestamp = Date.now();
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await supabaseClient.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, fileBase64, {
          contentType: file.mimetype
        });

      if (error) throw error;

      const { data: urlData } = supabaseClient.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

      return {
        path: data.path,
        publicUrl: urlData.publicUrl,
        fileName: fileName,
        size: file.size,
        mimetype: file.mimetype,
        originalName: file.originalname
      };
    });

    const results = await Promise.all(uploadPromises);
    
    log(`✅ تم رفع ${results.length} صور بنجاح`);

    res.json({ 
      success: true, 
      message: `تم رفع ${results.length} صور بنجاح`,
      data: results 
    });

  } catch (error: any) {
    log(`❌ خطأ في رفع الصور: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'فشل في رفع الصور',
      error: error.message 
    });
  }
});

// Delete image endpoint
router.delete('/image', async (req: Request, res: Response) => {
  try {
    const { path } = req.body;
    
    if (!path) {
      return res.status(400).json({ 
        success: false, 
        message: 'مسار الصورة مطلوب' 
      });
    }

    const { error } = await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) {
      throw error;
    }

    log(`🗑️ تم حذف الصورة: ${path}`);

    res.json({
      success: true,
      message: 'تم حذف الصورة بنجاح'
    });

  } catch (error: any) {
    log(`❌ خطأ في حذف الصورة: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'فشل في حذف الصورة',
      error: error.message 
    });
  }
});

export default router;