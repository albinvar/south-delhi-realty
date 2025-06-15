"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const cloudinary_1 = require("cloudinary");
const drizzle_orm_1 = require("drizzle-orm");
const http_1 = require("http");
const schema_1 = require("../shared/schema");
const auth_1 = __importDefault(require("./auth"));
const db_1 = require("./db");
const email_1 = require("./email");
const multer_config_1 = require("./multer-config");
const storage_1 = require("./storage");
const app_typed = (app) => app;
const routeHandler = (handler) => handler;
const cloudinary = cloudinary_1.v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("🔧 Cloudinary Configuration:");
console.log("   CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Missing");
console.log("   API_KEY:", process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing");
console.log("   API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Missing");
const checkCloudinaryConfig = (req, res, next) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        res.status(500).json({
            error: "Cloudinary configuration missing. Please check environment variables."
        });
        return;
    }
    next();
};
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        return result;
    }
    catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};
async function registerRoutes(app) {
    const httpServer = (0, http_1.createServer)(app);
    const router = app;
    const appTyped = app;
    app.use('/api/auth', auth_1.default);
    const ensureAuthenticated = (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }
        res.status(401).json({ message: "Unauthorized" });
    };
    const ensureAdmin = (req, res, next) => {
        if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
            return next();
        }
        res.status(403).json({ message: "Forbidden" });
    };
    function ensureSuperAdmin(req, res, next) {
        if (req.isAuthenticated() && req.user.role === 'superadmin') {
            return next();
        }
        res.status(403).json({ message: 'Access denied - requires superadmin role' });
    }
    function ensureStaff(req, res, next) {
        if (req.isAuthenticated() &&
            (req.user.role === 'staff' || req.user.role === 'admin' || req.user.role === 'superadmin')) {
            return next();
        }
        res.status(403).json({ message: 'Access denied - requires staff role or higher' });
    }
    app.get('/api/admin/users', ensureSuperAdmin, async (req, res, next) => {
        try {
            const users = await storage_1.storage.getUsers();
            res.json(users);
        }
        catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ message: 'Failed to fetch users' });
        }
    });
    app.post('/api/admin/users', ensureSuperAdmin, async (req, res, next) => {
        try {
            const { username, email, password, role } = req.body;
            if (!['staff', 'admin', 'superadmin'].includes(role)) {
                res.status(400).json({ message: 'Invalid role. Must be staff, admin, or superadmin' });
                return;
            }
            const existingUsername = await storage_1.storage.getUserByUsername(username);
            if (existingUsername) {
                res.status(400).json({ message: 'Username already exists' });
                return;
            }
            const existingEmail = await storage_1.storage.getUserByEmail(email);
            if (existingEmail) {
                res.status(400).json({ message: 'Email already exists' });
                return;
            }
            const { hashPassword } = await Promise.resolve().then(() => __importStar(require('./auth')));
            const hashedPassword = await hashPassword(password);
            const newUser = await storage_1.storage.createUser({
                username,
                email,
                password: hashedPassword,
                role
            });
            const { password: _, ...userWithoutPassword } = newUser;
            res.status(201).json(userWithoutPassword);
        }
        catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ message: 'Failed to create user' });
        }
    });
    app.delete("/api/admin/users/:userId", ensureSuperAdmin, async (req, res, next) => {
        const userId = parseInt(req.params.userId, 10);
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        if (req.user.id === userId) {
            res.status(400).json({ message: "Cannot delete your own account" });
            return;
        }
        try {
            const deleted = await storage_1.storage.deleteUser(userId);
            if (deleted) {
                res.json({ message: "User deleted successfully" });
            }
            else {
                res.status(404).json({ message: "User not found" });
            }
        }
        catch (error) {
            console.error("Error deleting user:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    });
    app.put("/api/admin/users/:userId", ensureSuperAdmin, async (req, res, next) => {
        const userId = parseInt(req.params.userId, 10);
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        try {
            const { username, email, role } = req.body;
            if (!username && !email && !role) {
                res.status(400).json({ message: "At least one field must be provided for update" });
                return;
            }
            const updateData = {};
            if (username)
                updateData.username = username;
            if (email)
                updateData.email = email;
            if (role)
                updateData.role = role;
            const updatedUser = await storage_1.storage.updateUser(userId, updateData);
            if (updatedUser) {
                const { password: _, ...userWithoutPassword } = updatedUser;
                res.json(userWithoutPassword);
            }
            else {
                res.status(404).json({ message: "User not found" });
            }
        }
        catch (error) {
            console.error("Error updating user:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    });
    app.get("/api/properties", async (req, res) => {
        try {
            console.log("Fetching properties with filters...");
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 9;
            const status = req.query.status;
            const category = req.query.category;
            const propertyType = req.query.propertyType;
            const subType = req.query.subType;
            const minPrice = req.query.minPrice ? parseInt(req.query.minPrice) : undefined;
            const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice) : undefined;
            const minArea = req.query.minArea ? parseInt(req.query.minArea) : undefined;
            const maxArea = req.query.maxArea ? parseInt(req.query.maxArea) : undefined;
            const bedrooms = req.query.bedrooms ? parseInt(req.query.bedrooms) : undefined;
            const bathrooms = req.query.bathrooms ? parseInt(req.query.bathrooms) : undefined;
            const furnishedStatus = req.query.furnishedStatus;
            const parking = req.query.parking;
            const facing = req.query.facing;
            const search = req.query.search;
            const filters = {
                page,
                limit,
                status: status,
                category: category,
                propertyType: propertyType,
                subType: subType,
                minPrice,
                maxPrice,
                minArea,
                maxArea,
                bedrooms,
                bathrooms,
                furnishedStatus: furnishedStatus,
                parking: parking,
                facing: facing,
                search
            };
            console.log("Using enhanced filters:", filters);
            const { properties, total } = await storage_1.storage.getPropertiesWithPagination(filters);
            console.log(`Found ${properties.length} properties out of ${total} total.`);
            const totalPages = Math.ceil(total / limit);
            res.json({
                properties,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
            });
        }
        catch (error) {
            console.error("Error fetching properties:", error);
            res.status(500).json({ error: "Failed to fetch properties" });
        }
    });
    app.get("/api/featured-properties", async (req, res, next) => {
        try {
            const limit = parseInt(req.query.limit) || 3;
            const { properties } = await storage_1.storage.getPropertiesWithPagination({
                isActive: true,
                limit,
                page: 1
            });
            res.json(properties);
        }
        catch (error) {
            console.error("Error fetching featured properties:", error);
            res.status(500).json({ error: "Failed to fetch featured properties" });
        }
    });
    app.get("/api/properties/:slug", async (req, res, next) => {
        try {
            const property = await storage_1.storage.getPropertyBySlug(req.params.slug);
            if (!property) {
                res.status(404).json({ message: "Property not found" });
                return;
            }
            res.json(property);
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/api/properties/:id/nearby-facilities", async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ message: "Invalid property ID" });
                return;
            }
            const { radius = '1', facilityType } = req.query;
            const searchRadius = parseFloat(radius) || 1;
            const searchRadiusMeters = searchRadius * 1000;
            const facilities = await storage_1.storage.getNearbyFacilities(id);
            const filteredByRadius = facilities.filter(facility => {
                if (facility.distanceValue !== undefined && facility.distanceValue !== null) {
                    return facility.distanceValue <= searchRadiusMeters;
                }
                else if (typeof facility.distance === 'string') {
                    const distanceMatch = facility.distance.match(/^(\d+(\.\d+)?)/);
                    if (distanceMatch) {
                        const distanceValue = parseFloat(distanceMatch[1]);
                        return distanceValue <= searchRadius;
                    }
                }
                return false;
            });
            const result = facilityType
                ? filteredByRadius.filter(f => f.facilityType === facilityType)
                : filteredByRadius;
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    });
    app.post("/api/inquiries", async (req, res, next) => {
        try {
            console.log('📝 Inquiry submission started');
            console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
            console.log('📋 Content-Type:', req.headers['content-type']);
            console.log('🔍 Validating inquiry data...');
            console.log('insertInquirySchema exists:', !!schema_1.insertInquirySchema);
            console.log('About to parse request body...');
            const validatedData = schema_1.insertInquirySchema.parse(req.body);
            console.log('✅ Inquiry data validated:', validatedData);
            console.log('💾 Creating inquiry in database...');
            console.log('🔍 Checking storage object...');
            console.log('Storage object exists:', !!storage_1.storage);
            console.log('createInquiry method exists:', typeof storage_1.storage.createInquiry);
            console.log('Storage object type:', typeof storage_1.storage);
            console.log('Storage object constructor:', storage_1.storage.constructor.name);
            const inquiry = await storage_1.storage.createInquiry(validatedData);
            console.log('✅ Inquiry created with ID:', inquiry.id);
            console.log('📧 Preparing email notification...');
            let property = null;
            if (inquiry.propertyId) {
                console.log('🏠 Fetching property details for ID:', inquiry.propertyId);
                try {
                    property = await storage_1.storage.getPropertyById(inquiry.propertyId);
                    console.log('✅ Property details fetched:', property?.title || 'No title');
                }
                catch (propError) {
                    console.warn('⚠️  Failed to fetch property details:', propError);
                }
            }
            if (property) {
                await (0, email_1.sendInquiryNotification)(inquiry, property);
                console.log('✅ Email notification processed');
                await (0, email_1.sendUserConfirmationEmail)(inquiry, property);
            }
            console.log('✅ User confirmation email processed');
            const response = inquiry;
            console.log('✅ Inquiry submission completed:', response);
            res.status(201).json(response);
        }
        catch (error) {
            console.error('❌ Inquiry submission error:', error);
            if (error instanceof Error && error.name === 'ZodError') {
                console.error('❌ Validation errors:', error.issues);
                res.status(400).json({
                    message: "Validation failed",
                    errors: error.issues
                });
                return;
            }
            next(error);
        }
    });
    app.get("/api/property-types", async (_req, res) => {
        res.json({
            propertyTypes: ["apartment", "independent-house", "villa", "farm-house", "shop", "basement"],
            propertyCategories: ["residential", "commercial"],
            status: ["sale", "rent"],
            subTypes: ["1rk", "1bhk", "2bhk", "3bhk", "4bhk", "plot", "other"],
            areaUnits: ["sq_ft", "sq_mt", "sq_yd"],
            furnishedStatus: ["furnished", "semi-furnished", "unfurnished"],
            facingOptions: ["east", "west", "north", "south", "road", "park", "greenery"],
            parkingOptions: ["car", "two-wheeler", "both", "none"],
            facilityTypes: ["school", "hospital", "market", "park", "metro", "bus-stop", "bank", "atm", "restaurant", "gym", "temple", "mall", "gas-station", "other"]
        });
    });
    app.get("/api/admin/dashboard", ensureAuthenticated, async (_req, res, next) => {
        try {
            const stats = await storage_1.storage.getDashboardStats();
            res.json(stats);
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/api/admin/properties", ensureAuthenticated, async (_req, res, next) => {
        try {
            const properties = await storage_1.storage.getProperties();
            res.json(properties);
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/api/admin/properties/:id", ensureAuthenticated, async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ message: "Invalid ID" });
                return;
            }
            const property = await storage_1.storage.getPropertyById(id);
            if (!property) {
                res.status(404).json({ message: "Property not found" });
                return;
            }
            res.json(property);
        }
        catch (error) {
            next(error);
        }
    });
    app.post("/api/admin/properties", ensureAuthenticated, async (req, res, next) => {
        try {
            if (req.body.areaUnit) {
                const areaUnitMap = {
                    'sq_ft': 'sq-ft',
                    'sq_mt': 'sq-mt',
                    'sq_yd': 'sq-yd'
                };
                req.body.areaUnit = areaUnitMap[req.body.areaUnit] || req.body.areaUnit;
            }
            const validatedData = schema_1.insertPropertySchema.parse(req.body);
            const property = await storage_1.storage.createProperty(validatedData);
            res.status(201).json(property);
        }
        catch (error) {
            next(error);
        }
    });
    app.put("/api/admin/properties/:id", ensureAuthenticated, routeHandler(async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid ID" });
            }
            if (req.body.areaUnit) {
                const areaUnitMap = {
                    'sq_ft': 'sq-ft',
                    'sq_mt': 'sq-mt',
                    'sq_yd': 'sq-yd'
                };
                req.body.areaUnit = areaUnitMap[req.body.areaUnit] || req.body.areaUnit;
            }
            const validatedData = schema_1.insertPropertySchema.partial().parse(req.body);
            const property = await storage_1.storage.updateProperty(id, validatedData);
            if (!property) {
                return res.status(404).json({ message: "Property not found" });
            }
            res.json(property);
        }
        catch (error) {
            next(error);
        }
    }));
    app.delete("/api/admin/properties/:id", ensureAuthenticated, routeHandler(async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid ID" });
            }
            const media = await storage_1.storage.getPropertyMedia(id);
            const deleted = await storage_1.storage.deleteProperty(id);
            if (!deleted) {
                return res.status(404).json({ message: "Property not found" });
            }
            for (const item of media) {
                try {
                    const resourceType = item.mediaType === 'video' ? 'video' : 'image';
                    await deleteFromCloudinary(item.cloudinaryId, resourceType);
                }
                catch (err) {
                    console.error(`Failed to delete ${item.cloudinaryId} from Cloudinary:`, err);
                }
            }
            res.status(200).json({ message: "Property deleted successfully" });
        }
        catch (error) {
            next(error);
        }
    }));
    app.post("/api/admin/media/upload", ensureAuthenticated, checkCloudinaryConfig, async (req, res) => {
        try {
            console.log("📨 Media upload request received");
            console.log("📋 Request body keys:", Object.keys(req.body));
            if (!req.body.fileData) {
                console.log("❌ No fileData found in request body");
                res.status(400).json({ error: "No file data provided" });
                return;
            }
            const { fileData, fileName, propertyId } = req.body;
            console.log(`📤 Uploading file: ${fileName} for property ${propertyId}`);
            console.log(`📊 File data length: ${fileData ? fileData.length : 'undefined'} characters`);
            const uploadResponse = await cloudinary.uploader.upload(fileData, {
                folder: "south-delhi-realty",
                public_id: `property-${propertyId}-${Date.now()}`,
                resource_type: "auto"
            });
            console.log('✅ Cloudinary upload successful:', uploadResponse.public_id);
            let newMedia = null;
            if (propertyId !== 'temp' && !isNaN(parseInt(propertyId))) {
                const mediaData = {
                    propertyId: parseInt(propertyId),
                    mediaType: uploadResponse.resource_type === 'video' ? 'video' : 'image',
                    cloudinaryId: uploadResponse.public_id,
                    cloudinaryUrl: uploadResponse.secure_url,
                    isFeatured: false,
                    orderIndex: 0
                };
                newMedia = await storage_1.storage.createPropertyMedia(mediaData);
            }
            res.json({
                success: true,
                media: newMedia,
                cloudinaryId: uploadResponse.public_id,
                cloudinaryUrl: uploadResponse.secure_url,
                mediaType: uploadResponse.resource_type === 'video' ? 'video' : 'image'
            });
        }
        catch (error) {
            console.error('❌ Media upload error:', error);
            res.status(500).json({
                error: "Failed to upload media",
                details: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });
    app.post("/api/admin/media/upload-watermarked", ensureAuthenticated, checkCloudinaryConfig, routeHandler(async (req, res) => {
        try {
            console.log("📨 Watermarked media upload request received");
            console.log("📋 Request body keys:", Object.keys(req.body));
            if (!req.body.fileData) {
                console.log("❌ No fileData found in request body");
                return res.status(400).json({ error: "No file data provided" });
            }
            const { fileData, fileName, propertyId, applyWatermark = true } = req.body;
            const fileSizeBytes = Math.round((fileData.length * 3) / 4);
            const fileSizeMB = fileSizeBytes / (1024 * 1024);
            console.log(`📤 Uploading file: ${fileName} for property ${propertyId}`);
            console.log(`📊 File size: ${fileSizeMB.toFixed(2)}MB`);
            console.log(`🎨 Watermark enabled: ${applyWatermark}`);
            const maxSizeMB = 100;
            if (fileSizeMB > maxSizeMB) {
                console.log(`❌ File too large: ${fileSizeMB.toFixed(2)}MB > ${maxSizeMB}MB`);
                return res.status(413).json({
                    error: "File too large",
                    details: `File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum limit of ${maxSizeMB}MB. Please compress your video or choose a smaller file.`,
                    maxSizeMB,
                    actualSizeMB: Math.round(fileSizeMB * 100) / 100
                });
            }
            const isImage = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i);
            const isVideo = fileName.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/i);
            if (!isImage && !isVideo) {
                console.log(`❌ Unsupported file type: ${fileName}`);
                return res.status(400).json({
                    error: "Unsupported file type",
                    details: "Please upload images (JPG, PNG, GIF, WebP) or videos (MP4, MOV, AVI, MKV, WebM)",
                    fileName
                });
            }
            let uploadOptions = {
                folder: "south-delhi-realty",
                public_id: `property-${propertyId}-${Date.now()}`,
                resource_type: "auto"
            };
            if ((isImage || isVideo) && applyWatermark) {
                if (isImage) {
                    console.log("🎨 Applying SOUTH DELHI REALTY watermark to image");
                    uploadOptions.transformation = [
                        {
                            overlay: {
                                font_family: "Arial",
                                font_size: 40,
                                font_weight: "bold",
                                text: "SOUTH DELHI REALTY"
                            },
                            color: "white",
                            gravity: "south_east",
                            x: 20,
                            y: 20,
                            opacity: 80
                        },
                        {
                            overlay: {
                                font_family: "Arial",
                                font_size: 40,
                                font_weight: "bold",
                                text: "SOUTH DELHI REALTY"
                            },
                            color: "black",
                            gravity: "south_east",
                            x: 22,
                            y: 22,
                            opacity: 30
                        },
                        {
                            quality: "auto:good",
                            fetch_format: "auto"
                        }
                    ];
                }
                else if (isVideo) {
                    console.log("🎨 Applying SOUTH DELHI REALTY watermark to video");
                    const isLargeVideo = fileSizeMB > 20;
                    const videoTransformation = [
                        {
                            overlay: {
                                font_family: "Arial",
                                font_size: 60,
                                font_weight: "bold",
                                text: "SOUTH DELHI REALTY"
                            },
                            color: "white",
                            gravity: "south_east",
                            x: 30,
                            y: 30,
                            opacity: 90
                        },
                        {
                            overlay: {
                                font_family: "Arial",
                                font_size: 60,
                                font_weight: "bold",
                                text: "SOUTH DELHI REALTY"
                            },
                            color: "black",
                            gravity: "south_east",
                            x: 32,
                            y: 32,
                            opacity: 40
                        },
                        {
                            quality: "auto:good"
                        }
                    ];
                    if (isLargeVideo) {
                        console.log(`🎬 Large video detected (${fileSizeMB.toFixed(2)}MB), using async processing`);
                        uploadOptions.eager = videoTransformation;
                        uploadOptions.eager_async = true;
                        uploadOptions.eager_notification_url = `${req.protocol}://${req.get('host')}/api/webhooks/cloudinary`;
                    }
                    else {
                        console.log(`🎬 Small video (${fileSizeMB.toFixed(2)}MB), using sync processing`);
                        uploadOptions.transformation = videoTransformation;
                    }
                }
            }
            const uploadResponse = await cloudinary.uploader.upload(fileData, uploadOptions);
            console.log('✅ Cloudinary upload successful:', uploadResponse.public_id);
            console.log('🎨 Watermark applied:', (isImage || isVideo) && applyWatermark ? 'Yes' : 'No');
            console.log('📄 Media type:', uploadResponse.resource_type);
            const isLargeVideo = isVideo && fileSizeMB > 20 && applyWatermark;
            let newMedia = null;
            if (propertyId !== 'temp' && !isNaN(parseInt(propertyId))) {
                const mediaData = {
                    propertyId: parseInt(propertyId),
                    mediaType: uploadResponse.resource_type === 'video' ? 'video' : 'image',
                    cloudinaryId: uploadResponse.public_id,
                    cloudinaryUrl: uploadResponse.secure_url,
                    isFeatured: false,
                    orderIndex: 0
                };
                newMedia = await storage_1.storage.createPropertyMedia(mediaData);
            }
            const response = {
                success: true,
                media: newMedia,
                cloudinaryId: uploadResponse.public_id,
                cloudinaryUrl: uploadResponse.secure_url,
                mediaType: uploadResponse.resource_type === 'video' ? 'video' : 'image',
                watermarkApplied: (isImage || isVideo) && applyWatermark,
                fileSizeMB: Math.round(fileSizeMB * 100) / 100,
                ...(isLargeVideo && {
                    processingStatus: 'async',
                    message: 'Video uploaded successfully! Watermarking is being processed in the background.',
                    note: 'The watermarked version will be available shortly. You can continue using the video.'
                })
            };
            console.log('📤 Upload response:', {
                success: response.success,
                mediaType: response.mediaType,
                watermarkApplied: response.watermarkApplied,
                processingStatus: response.processingStatus || 'complete'
            });
            res.json(response);
        }
        catch (error) {
            console.error('❌ Watermarked media upload error:', error);
            if (error instanceof Error) {
                if (error.message.includes('File size too large')) {
                    return res.status(413).json({
                        error: "File too large for Cloudinary",
                        details: "The file exceeds Cloudinary's upload limits. Please compress your video or use a smaller file.",
                        suggestion: "Try reducing video resolution or duration"
                    });
                }
                if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                    return res.status(408).json({
                        error: "Upload timeout",
                        details: "The file upload took too long. This often happens with large video files.",
                        suggestion: "Try compressing the video or check your internet connection"
                    });
                }
            }
            res.status(500).json({
                error: "Failed to upload media with watermark",
                details: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }));
    app.post("/api/admin/media/upload-multiple", ensureAuthenticated, checkCloudinaryConfig, multer_config_1.upload.array('files', 10), (req, res) => {
        try {
            const uploadedFiles = req.files;
            if (!uploadedFiles || uploadedFiles.length === 0) {
                res.status(400).json({ error: "No files uploaded" });
                return;
            }
            const validFiles = uploadedFiles.filter((file) => file.cloudinaryId && file.cloudinaryUrl);
            res.json({
                success: true,
                message: `${validFiles.length} files uploaded successfully`,
                files: validFiles.map((file) => ({
                    cloudinaryId: file.cloudinaryId,
                    cloudinaryUrl: file.cloudinaryUrl,
                    originalName: file.originalname
                }))
            });
        }
        catch (error) {
            console.error('Multiple upload error:', error);
            res.status(500).json({
                error: "Failed to upload files",
                details: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });
    app.post("/api/admin/properties/:propertyId/media", ensureAuthenticated, routeHandler(async (req, res, next) => {
        try {
            console.log('📤 Individual media upload started for property:', req.params.propertyId);
            console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
            const propertyId = parseInt(req.params.propertyId);
            if (isNaN(propertyId)) {
                console.log('❌ Invalid property ID:', req.params.propertyId);
                return res.status(400).json({ message: "Invalid property ID" });
            }
            const mediaData = {
                ...req.body,
                propertyId
            };
            console.log('💾 Creating individual media with data:', mediaData);
            const media = await storage_1.storage.createPropertyMedia(mediaData);
            console.log('✅ Created individual media with ID:', media.id);
            const response = media;
            console.log('✅ Individual media upload completed:', response);
            res.status(201).json(response);
        }
        catch (error) {
            console.error('❌ Individual media upload error:', error);
            next(error);
        }
    }));
    app.post("/api/admin/properties/:propertyId/media/batch", ensureAuthenticated, routeHandler(async (req, res, next) => {
        try {
            console.log('📤 Media batch upload started for property:', req.params.propertyId);
            console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
            const propertyId = parseInt(req.params.propertyId);
            if (isNaN(propertyId)) {
                console.log('❌ Invalid property ID:', req.params.propertyId);
                return res.status(400).json({ message: "Invalid property ID" });
            }
            if (!Array.isArray(req.body)) {
                console.log('❌ Request body is not an array:', typeof req.body);
                return res.status(400).json({ message: "Expected an array of media items" });
            }
            const results = [];
            const errors = [];
            for (let i = 0; i < req.body.length; i++) {
                const mediaItem = req.body[i];
                console.log(`📸 Processing media item ${i + 1}/${req.body.length}:`, mediaItem);
                try {
                    const mediaData = {
                        ...mediaItem,
                        propertyId,
                        orderIndex: mediaItem.orderIndex !== undefined ? mediaItem.orderIndex : i
                    };
                    console.log(`💾 Creating media with data:`, mediaData);
                    const media = await storage_1.storage.createPropertyMedia(mediaData);
                    console.log(`✅ Created media with ID:`, media.id);
                    results.push(media);
                }
                catch (error) {
                    console.error(`❌ Error creating media item ${i}:`, error);
                    errors.push({
                        index: i,
                        error: error instanceof Error ? error.message : "Unknown error",
                        item: mediaItem
                    });
                }
            }
            const response = {
                success: true,
                total: req.body.length,
                created: results.length,
                failed: errors.length,
                media: results,
                errors: errors.length > 0 ? errors : undefined
            };
            console.log('✅ Media batch upload completed:', response);
            res.status(201).json(response);
        }
        catch (error) {
            console.error('❌ Media batch upload error:', error);
            next(error);
        }
    }));
    app.delete("/api/admin/media/:id", ensureAuthenticated, routeHandler(async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid ID" });
            }
            console.log(`🗑️ DELETE request for media ID: ${id}`);
            const mediaItems = await db_1.db.select().from(schema_1.propertyMedia).where((0, drizzle_orm_1.eq)(schema_1.propertyMedia.id, id));
            if (mediaItems.length === 0) {
                console.log(`❌ Media ID ${id} not found in database`);
                return res.status(404).json({ message: "Media not found" });
            }
            const mediaItem = mediaItems[0];
            console.log(`✅ Found media: ${mediaItem.cloudinaryId}`);
            const deleted = await storage_1.storage.deletePropertyMedia(id);
            if (deleted) {
                try {
                    const resourceType = mediaItem.mediaType === 'video' ? 'video' : 'image';
                    console.log(`🗑️ Deleting from Cloudinary: ${mediaItem.cloudinaryId} (${resourceType})`);
                    await deleteFromCloudinary(mediaItem.cloudinaryId, resourceType);
                    console.log(`✅ Successfully deleted from Cloudinary`);
                }
                catch (cloudinaryErr) {
                    console.error('❌ Error deleting from Cloudinary:', cloudinaryErr);
                }
                console.log(`✅ Media ${id} deleted successfully`);
                res.json({ message: "Media deleted successfully" });
            }
            else {
                console.log(`❌ Failed to delete media ${id} from database`);
                res.status(404).json({ message: "Media not found" });
            }
        }
        catch (error) {
            console.error('❌ Error in DELETE media endpoint:', error);
            next(error);
        }
    }));
    app.put("/api/admin/properties/:propertyId/media/:id/featured", ensureAuthenticated, routeHandler(async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const propertyId = parseInt(req.params.propertyId);
            if (isNaN(id) || isNaN(propertyId)) {
                return res.status(400).json({ message: "Invalid ID" });
            }
            const updated = await storage_1.storage.setFeaturedMedia(id, propertyId);
            if (updated) {
                res.json({ message: "Featured media updated successfully" });
            }
            else {
                res.status(404).json({ message: "Media not found" });
            }
        }
        catch (error) {
            next(error);
        }
    }));
    app.post("/api/admin/properties/:propertyId/facilities", ensureAuthenticated, routeHandler(async (req, res, next) => {
        try {
            const propertyId = parseInt(req.params.propertyId);
            if (isNaN(propertyId)) {
                return res.status(400).json({ message: "Invalid property ID" });
            }
            const property = await storage_1.storage.getPropertyById(propertyId);
            if (!property) {
                return res.status(404).json({ message: "Property not found" });
            }
            let facilityData = {
                ...req.body,
                propertyId
            };
            if (!facilityData.distanceValue && facilityData.distance) {
                const distanceMatch = facilityData.distance.match(/^(\d+(\.\d+)?)/);
                if (distanceMatch) {
                    const distanceNumeric = parseFloat(distanceMatch[1]);
                    if (facilityData.distance.toLowerCase().includes("km")) {
                        facilityData.distanceValue = Math.round(distanceNumeric * 1000);
                    }
                    else if (facilityData.distance.toLowerCase().includes("m")) {
                        facilityData.distanceValue = Math.round(distanceNumeric);
                    }
                    else {
                        facilityData.distanceValue = Math.round(distanceNumeric * 1000);
                    }
                }
            }
            if (property.latitude && property.longitude &&
                facilityData.latitude && facilityData.longitude &&
                !facilityData.distanceValue) {
                try {
                    const R = 6371e3;
                    const φ1 = parseFloat(property.latitude) * Math.PI / 180;
                    const φ2 = parseFloat(facilityData.latitude) * Math.PI / 180;
                    const Δφ = (parseFloat(facilityData.latitude) - parseFloat(property.latitude)) * Math.PI / 180;
                    const Δλ = (parseFloat(facilityData.longitude) - parseFloat(property.longitude)) * Math.PI / 180;
                    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                        Math.cos(φ1) * Math.cos(φ2) *
                            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const distanceInMeters = Math.round(R * c);
                    facilityData.distanceValue = distanceInMeters;
                    if (!facilityData.distance) {
                        if (distanceInMeters < 1000) {
                            facilityData.distance = `${distanceInMeters} m`;
                        }
                        else {
                            facilityData.distance = `${(distanceInMeters / 1000).toFixed(1)} km`;
                        }
                    }
                }
                catch (error) {
                    console.error("Error calculating distance:", error);
                }
            }
            const validatedData = schema_1.insertNearbyFacilitySchema.parse(facilityData);
            const facility = await storage_1.storage.createNearbyFacility(validatedData);
            res.status(201).json(facility);
        }
        catch (error) {
            next(error);
        }
    }));
    app.delete("/api/admin/facilities/:id", ensureAuthenticated, routeHandler(async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid ID" });
            }
            const deleted = await storage_1.storage.deleteNearbyFacility(id);
            if (deleted) {
                res.json({ message: "Facility deleted successfully" });
            }
            else {
                res.status(404).json({ message: "Facility not found" });
            }
        }
        catch (error) {
            next(error);
        }
    }));
    app.get("/api/admin/inquiries", ensureAuthenticated, async (req, res, next) => {
        try {
            const filters = {};
            if (req.query.propertyId) {
                filters.propertyId = parseInt(req.query.propertyId);
            }
            if (req.query.status) {
                filters.status = req.query.status;
            }
            const inquiries = await storage_1.storage.getInquiries(filters);
            res.json(inquiries);
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/api/debug/inquiry-ids", async (req, res, next) => {
        try {
            console.log('🔍 Debug endpoint called - fetching all inquiry IDs');
            const inquiries = await storage_1.storage.getInquiries();
            const inquiryIds = inquiries.map(inquiry => ({
                id: inquiry.id,
                name: inquiry.name,
                email: inquiry.email,
                createdAt: inquiry.createdAt
            }));
            console.log('🔍 Found inquiry IDs:', inquiryIds.map(i => i.id));
            res.json(inquiryIds);
        }
        catch (error) {
            console.error('🔍 Error in debug endpoint:', error);
            next(error);
        }
    });
    app.put("/api/admin/inquiries/:id", ensureAuthenticated, routeHandler(async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid ID" });
            }
            if (!req.body.status || !['new', 'contacted', 'resolved'].includes(req.body.status)) {
                return res.status(400).json({ message: "Invalid status" });
            }
            const inquiry = await storage_1.storage.updateInquiryStatus(id, req.body.status);
            if (!inquiry) {
                return res.status(404).json({ message: "Inquiry not found" });
            }
            res.json(inquiry);
        }
        catch (error) {
            next(error);
        }
    }));
    app.delete("/api/admin/inquiries/:id", ensureAuthenticated, routeHandler(async (req, res, next) => {
        try {
            console.log(`🗑️ DELETE /api/admin/inquiries/:id route called`);
            console.log(`📦 Request params:`, req.params);
            console.log(`📦 Raw ID parameter:`, req.params.id);
            const id = parseInt(req.params.id);
            console.log(`🔢 Parsed ID:`, id);
            if (isNaN(id)) {
                console.log(`❌ Invalid ID - not a number: ${req.params.id}`);
                return res.status(400).json({ message: "Invalid ID" });
            }
            console.log(`🗑️ Calling storage.deleteInquiry(${id})`);
            const deleted = await storage_1.storage.deleteInquiry(id);
            console.log(`🗑️ storage.deleteInquiry(${id}) returned:`, deleted);
            if (deleted) {
                console.log(`✅ Inquiry ${id} deleted successfully`);
                res.json({ message: "Inquiry deleted successfully" });
            }
            else {
                console.log(`❌ Inquiry ${id} not found or could not be deleted`);
                res.status(404).json({ message: "Inquiry not found" });
            }
        }
        catch (error) {
            console.error(`❌ Error in DELETE /api/admin/inquiries/:id:`, error);
            next(error);
        }
    }));
    app.get("/api/admin/email/test-config", ensureAuthenticated, async (req, res, next) => {
        try {
            console.log('🧪 Testing email configuration...');
            const result = { success: true, message: 'Email configuration test not implemented' };
            res.json(result);
        }
        catch (error) {
            console.error('❌ Email config test error:', error);
            next(error);
        }
    });
    app.post("/api/admin/email/send-test", ensureAuthenticated, async (req, res, next) => {
        try {
            console.log('📧 Sending test email...');
            const result = { success: true, message: 'Test email send not implemented' };
            res.json(result);
        }
        catch (error) {
            console.error('❌ Test email send error:', error);
            next(error);
        }
    });
    app.post("/api/webhooks/cloudinary", async (req, res) => {
        try {
            console.log("🔗 Cloudinary webhook received");
            console.log("📋 Webhook data:", JSON.stringify(req.body, null, 2));
            const { notification_type, public_id, eager } = req.body;
            if (notification_type === 'eager' && public_id) {
                console.log(`✅ Async transformation completed for: ${public_id}`);
                if (eager && eager.length > 0) {
                    console.log(`🎬 Video watermarking completed successfully`);
                    console.log(`📄 Eager transformations: ${eager.length}`);
                }
            }
            res.status(200).json({ success: true, message: "Webhook received" });
        }
        catch (error) {
            console.error("❌ Error processing Cloudinary webhook:", error);
            res.status(500).json({ error: "Webhook processing failed" });
        }
    });
    app.post('/api/admin/fix-database', async (req, res, next) => {
        try {
            res.json({
                message: 'Database fix endpoint available',
                note: 'Direct database fix needs to be done manually',
                sql_commands: [
                    'ALTER TABLE users ADD COLUMN password text DEFAULT NULL AFTER email;',
                    "UPDATE users SET password = 'hashed_password_here', role = 'superadmin', email = 'superadmin@southdelhirealty.com' WHERE username = 'superadmin';"
                ],
                credentials: {
                    username: 'superadmin',
                    password: 'superadmin123',
                    email: 'superadmin@southdelhirealty.com'
                }
            });
        }
        catch (error) {
            console.error('❌ Database fix error:', error);
            res.status(500).json({
                message: 'Database fix failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    return httpServer;
}
