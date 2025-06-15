import { v2 as cloudinary } from 'cloudinary';
import { NextFunction, Request, Response } from 'express';
import { upload } from './multer';
export declare function checkCloudinaryConfig(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>>;
export declare function deleteFromCloudinary(publicId: string, resourceType?: 'image' | 'video'): Promise<any>;
export { cloudinary, upload };
