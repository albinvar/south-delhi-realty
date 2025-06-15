import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Create storage engine for Multer with type assertions to handle conflicts
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    public_id: ((req: any, file: any) => `south-delhi-realty-${Date.now()}`) as any,
    resource_type: 'auto', // detects if it's image or video
    transformation: [
      { quality: 'auto', fetch_format: 'auto' }
    ],
  } as any,
}) as any as multer.StorageEngine;

// Multer middleware configuration
export const upload = multer({ 
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
}); 