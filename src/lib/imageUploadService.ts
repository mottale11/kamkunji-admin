import { supabase } from './supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ImageUploadOptions {
  bucket?: string;
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

export class ImageUploadService {
  private bucket: string;
  private folder: string;
  private maxSize: number;
  private allowedTypes: string[];

  constructor(options: ImageUploadOptions = {}) {
    this.bucket = options.bucket || 'product-images';
    this.folder = options.folder || 'products';
    this.maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
    this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/webp'];
  }

  // Create bucket if it doesn't exist
  async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.bucket);
      
      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(this.bucket, {
          public: true,
          allowedMimeTypes: this.allowedTypes,
          fileSizeLimit: this.maxSize
        });
        
        if (error) {
          console.error('Failed to create bucket:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      throw error;
    }
  }

  // Upload single image
  async uploadImage(file: File, filename?: string): Promise<UploadResult> {
    try {
      // Validate file
      const validationResult = this.validateFile(file);
      if (!validationResult.success) {
        return { success: false, error: validationResult.error };
      }

      // Ensure bucket exists
      await this.ensureBucketExists();

      // Generate unique filename
      const uniqueFilename = filename || this.generateUniqueFilename(file);
      const filePath = `${this.folder}/${uniqueFilename}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error('Upload service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  // Upload multiple images
  async uploadMultipleImages(files: File[]): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadImage(file));
    return Promise.all(uploadPromises);
  }

  // Delete image
  async deleteImage(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete service error:', error);
      return false;
    }
  }

  // Get image URL
  getImageUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  // Validate file before upload
  private validateFile(file: File): { success: boolean; error?: string } {
    // Check file size
    if (file.size > this.maxSize) {
      return {
        success: false,
        error: `File size exceeds limit. Maximum allowed: ${this.formatFileSize(this.maxSize)}`
      };
    }

    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `File type not allowed. Allowed types: ${this.allowedTypes.join(', ')}`
      };
    }

    return { success: true };
  }

  // Generate unique filename
  private generateUniqueFilename(file: File): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
  }

  // Format file size for display
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Resize image before upload (client-side)
  async resizeImage(file: File, maxWidth: number = 800, maxHeight: number = 600): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to resize image'));
          }
        }, file.type, 0.8); // 80% quality
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Compress image
  async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx?.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, file.type, quality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

// Create default instance
export const imageUploadService = new ImageUploadService();

// Create specialized instances
export const productImageService = new ImageUploadService({
  bucket: 'product-images',
  folder: 'products',
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});

export const submissionImageService = new ImageUploadService({
  bucket: 'submission-images',
  folder: 'submissions',
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
});
