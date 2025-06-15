"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.cloudinary = void 0;
exports.checkCloudinaryConfig = checkCloudinaryConfig;
exports.deleteFromCloudinary = deleteFromCloudinary;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const multer_1 = require("./multer");
Object.defineProperty(exports, "upload", { enumerable: true, get: function () { return multer_1.upload; } });
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
function checkCloudinaryConfig(req, res, next) {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return res.status(500).json({ message: 'Cloudinary is not configured' });
    }
    next();
}
async function deleteFromCloudinary(publicId, resourceType = 'image') {
    try {
        const result = await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType });
        return result;
    }
    catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
}
