import { v2 as cloudinaryV2 } from 'cloudinary';
import { eq } from "drizzle-orm";
import type { Express, NextFunction, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from 'multer';
import { WebSocketServer } from 'ws';
import { insertInquirySchema, insertNearbyFacilitySchema, insertPropertySchema, propertyMedia } from "../shared/schema";
import authRouter from "./auth";
import { db } from "./db";
import { sendInquiryNotification, sendUserConfirmationEmail } from "./email";
import { storage } from "./storage";

// Initialize cloudinary and create upload middleware
const cloudinary = cloudinaryV2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Debug: Check Cloudinary configuration
console.log("🔧 Cloudinary Configuration:");
console.log("   CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Missing");
console.log("   API_KEY:", process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing");
console.log("   API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Missing");

// Extend Multer File interface to include Cloudinary properties
interface CloudinaryFile extends Express.Multer.File {
  cloudinaryId?: string;
  cloudinaryUrl?: string;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB - increased for video uploads
  }
});

// Cloudinary config check middleware
const checkCloudinaryConfig = (req: Request, res: Response, next: NextFunction): void => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    res.status(500).json({ 
      error: "Cloudinary configuration missing. Please check environment variables." 
    });
    return;
  }
  next();
};

const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<any> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server setup
  const wsServer = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });

  wsServer.on('connection', (ws, req) => {
    const connectionId = Math.random().toString(36).substring(2, 8);
    console.log(`🔌 New WebSocket connection [${connectionId}]`);
    console.log('🔍 Debug - req.url:', req.url);
    console.log('🔍 Debug - req.headers.host:', req.headers.host);

    // Parse token from query string  
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    console.log('🔍 Debug - parsed URL:', url.toString());
    console.log('🔍 Debug - searchParams:', url.searchParams.toString());
    const token = url.searchParams.get('token');
    console.log('🔍 Debug - extracted token:', token ? 'TOKEN_FOUND' : 'NO_TOKEN');

    // For development, we'll accept any token as long as one is provided
    // In production, this should validate against real JWT tokens
    if (!token || token.length < 10) {
      console.log('❌ WebSocket connection rejected: Invalid or missing token');
      ws.close(1008, 'Authentication required');
      return;
    }

    console.log('✅ WebSocket token validation passed');

    ws.on('message', (message) => {
      try {
        // Handle incoming messages
        console.log('📥 Received WebSocket message:', message.toString());
        
        // Echo back the message for now
        ws.send(JSON.stringify({ 
          type: 'echo',
          data: JSON.parse(message.toString())
        }));
      } catch (error) {
        console.error('❌ Error handling WebSocket message:', error);
        ws.send(JSON.stringify({ 
          type: 'error',
          message: 'Failed to process message'
        }));
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket connection closed [${connectionId}] - Code: ${code}, Reason: ${reason.toString()}`);
    });

    ws.on('error', (error) => {
      console.error(`❌ WebSocket error [${connectionId}]:`, error);
    });

    // Send initial connection success message
    ws.send(JSON.stringify({ 
      type: 'connected',
      message: 'WebSocket connection established',
      connectionId: connectionId
    }));
    
    console.log(`✅ WebSocket connection fully established [${connectionId}]`);
  });

  // Setup authentication routes
  app.use('/api/auth', authRouter);

  // Middleware to check authentication
  const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to check admin role
  const ensureAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user && (req.user as any).role === 'admin') {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // Middleware to ensure user is a superadmin
  function ensureSuperAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated() && req.user.role === 'superadmin') {
      return next();
    }
    res.status(403).json({ message: 'Access denied - requires superadmin role' });
  }

  // Middleware to ensure user is staff, admin, or superadmin
  function ensureStaff(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated() && 
        (req.user.role === 'staff' || req.user.role === 'admin' || req.user.role === 'superadmin')) {
      return next();
    }
    res.status(403).json({ message: 'Access denied - requires staff role or higher' });
  }

  // User management routes - Superadmin only
  app.get('/api/admin/users', ensureSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.post('/api/admin/users', ensureSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, email, password, role } = req.body;
      
      // Validate role
      if (!['staff', 'admin', 'superadmin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be staff, admin, or superadmin' });
      }
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      // Import hash function from auth module
      const { hashPassword } = await import('./auth');
      
      // Create the user with hashed password
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role
      });
      
      // Remove password before sending response
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.delete("/api/admin/users/:userId", ensureSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
    const userId = parseInt(req.params.userId, 10);
    
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (req.user.id === userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    try {
      const deleted = await storage.deleteUser(userId);
      if (deleted) {
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/users/:userId", ensureSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
    const userId = parseInt(req.params.userId, 10);
    
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      // Extract updateable fields from request body
      const { username, email, role } = req.body;
      
      // Validate that at least one field is provided
      if (!username && !email && !role) {
        return res.status(400).json({ message: "At least one field must be provided for update" });
      }
      
      // Build update object with only provided fields
      const updateData: any = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (updatedUser) {
        // Remove password from response
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Property routes - Public
  app.get("/api/properties", async (req, res) => {
    try {
      console.log("Fetching properties with filters...");
      
      // Extract filter parameters from query
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 9;
      const status = req.query.status as string;
      const category = req.query.category as string;
      const propertyType = req.query.propertyType as string;
      const subType = req.query.subType as string;
      const minPrice = req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined;
      const minArea = req.query.minArea ? parseInt(req.query.minArea as string) : undefined;
      const maxArea = req.query.maxArea ? parseInt(req.query.maxArea as string) : undefined;
      const bedrooms = req.query.bedrooms ? parseInt(req.query.bedrooms as string) : undefined;
      const bathrooms = req.query.bathrooms ? parseInt(req.query.bathrooms as string) : undefined;
      const furnishedStatus = req.query.furnishedStatus as string;
      const parking = req.query.parking as string;
      const facing = req.query.facing as string;
      const search = req.query.search as string;
      
      // Build comprehensive filters object with proper type assertions
      const filters = {
        page,
        limit,
        status: status as "sale" | "rent" | undefined,
        category: category as "residential" | "commercial" | undefined,
        propertyType: propertyType as "apartment" | "independent-house" | "villa" | "farm-house" | "shop" | "basement" | undefined,
        subType: subType as "1rk" | "1bhk" | "2bhk" | "3bhk" | "4bhk" | "plot" | "other" | undefined,
        minPrice,
        maxPrice,
        minArea,
        maxArea,
        bedrooms,
        bathrooms,
        furnishedStatus: furnishedStatus as "furnished" | "semi-furnished" | "unfurnished" | undefined,
        parking: parking as "car" | "two-wheeler" | "both" | "none" | undefined,
        facing: facing as "east" | "west" | "north" | "south" | "road" | "park" | "greenery" | undefined,
        search
      };
      
      console.log("Using enhanced filters:", filters);
      
      // Fetch properties with comprehensive filtering
      const { properties, total } = await storage.getPropertiesWithPagination(filters);
      console.log(`Found ${properties.length} properties out of ${total} total.`);
      
      // Calculate total pages
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
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });
  
  // Get featured properties for home page
  app.get("/api/featured-properties", async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      
      const { properties } = await storage.getPropertiesWithPagination({ 
        isActive: true,
        limit,
        page: 1
      });
      
      res.json(properties);
    } catch (error) {
      console.error("Error fetching featured properties:", error);
      res.status(500).json({ error: "Failed to fetch featured properties" });
    }
  });

  app.get("/api/properties/:slug", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await storage.getPropertyBySlug(req.params.slug);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      next(error);
    }
  });
  
  // Search for nearby facilities based on property location
  app.get("/api/properties/:id/nearby-facilities", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      const { radius = '1', facilityType } = req.query;
      const searchRadius = parseFloat(radius as string) || 1;
      const searchRadiusMeters = searchRadius * 1000;
      
      const facilities = await storage.getNearbyFacilities(id);
      
      const filteredByRadius = facilities.filter(facility => {
        if (facility.distanceValue !== undefined && facility.distanceValue !== null) {
          return facility.distanceValue <= searchRadiusMeters;
        } else if (typeof facility.distance === 'string') {
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
    } catch (error) {
      next(error);
    }
  });

  // Inquiry submission
  app.post("/api/inquiries", async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('📝 Inquiry submission started');
      console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
      console.log('📋 Content-Type:', req.headers['content-type']);
      
      console.log('🔍 Validating inquiry data...');
      console.log('insertInquirySchema exists:', !!insertInquirySchema);
      console.log('About to parse request body...');
      
      const validatedData = insertInquirySchema.parse(req.body);
      console.log('✅ Inquiry data validated:', validatedData);
      
      console.log('💾 Creating inquiry in database...');
      console.log('🔍 Checking storage object...');
      console.log('Storage object exists:', !!storage);
      console.log('createInquiry method exists:', typeof storage.createInquiry);
      console.log('Storage object type:', typeof storage);
      console.log('Storage object constructor:', storage.constructor.name);
      
      const inquiry = await storage.createInquiry(validatedData);
      console.log('✅ Inquiry created with ID:', inquiry.id);
      
      console.log('📧 Preparing email notification...');
      // Fetch property details if propertyId is provided
      let property = null;
      if (inquiry.propertyId) {
        console.log('🏠 Fetching property details for ID:', inquiry.propertyId);
        try {
          property = await storage.getPropertyById(inquiry.propertyId);
          console.log('✅ Property details fetched:', property?.title || 'No title');
        } catch (propError) {
          console.warn('⚠️  Failed to fetch property details:', propError);
        }
      }
      
      // Send email notification with property details
      if (property) {
        await sendInquiryNotification(inquiry, property);
        console.log('✅ Email notification processed');
        
        // Send confirmation email to the user
        await sendUserConfirmationEmail(inquiry, property);
      }
      console.log('✅ User confirmation email processed');
      
      const response = inquiry;
      console.log('✅ Inquiry submission completed:', response);
      res.status(201).json(response);
    } catch (error) {
      console.error('❌ Inquiry submission error:', error);
      
      // Check if it's a validation error
      if (error instanceof Error && (error as any).name === 'ZodError') {
        console.error('❌ Validation errors:', (error as any).issues);
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: (error as any).issues 
        });
      }
      
      next(error);
    }
  });

  // Property type lookup
  app.get("/api/property-types", async (_req: Request, res: Response) => {
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

  // Admin Dashboard API - Protected

  app.get("/api/admin/dashboard", ensureAuthenticated, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  // Admin Property Management
  app.get("/api/admin/properties", ensureAuthenticated, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/properties/:id", ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const property = await storage.getPropertyById(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/properties", ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Convert frontend underscore format to backend hyphen format for area units
      if (req.body.areaUnit) {
        const areaUnitMap: { [key: string]: string } = {
          'sq_ft': 'sq-ft',
          'sq_mt': 'sq-mt', 
          'sq_yd': 'sq-yd'
        };
        req.body.areaUnit = areaUnitMap[req.body.areaUnit] || req.body.areaUnit;
      }
      
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/properties/:id", ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Convert frontend underscore format to backend hyphen format for area units
      if (req.body.areaUnit) {
        const areaUnitMap: { [key: string]: string } = {
          'sq_ft': 'sq-ft',
          'sq_mt': 'sq-mt', 
          'sq_yd': 'sq-yd'
        };
        req.body.areaUnit = areaUnitMap[req.body.areaUnit] || req.body.areaUnit;
      }
      
      // Validate and filter the request body using the same schema as POST
      // Use partial() to allow partial updates (not all fields required)
      const validatedData = insertPropertySchema.partial().parse(req.body);
      
      const property = await storage.updateProperty(id, validatedData);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/properties/:id", ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // First, get all media to delete from Cloudinary
      const media = await storage.getPropertyMedia(id);
      
      // Delete property from database (which will cascade delete related records)
      const deleted = await storage.deleteProperty(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Delete all media files from Cloudinary
      for (const item of media) {
        try {
          const resourceType = item.mediaType === 'video' ? 'video' : 'image';
          await deleteFromCloudinary(item.cloudinaryId, resourceType);
        } catch (err) {
          console.error(`Failed to delete ${item.cloudinaryId} from Cloudinary:`, err);
        }
      }
      
      res.status(200).json({ message: "Property deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Property Media Management - original upload endpoint (for backward compatibility)
  app.post("/api/admin/media/upload", ensureAuthenticated, checkCloudinaryConfig, async (req: Request, res: Response): Promise<void> => {
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

      // Only save to database if this is for an existing property (not "temp")
      let newMedia = null;
      if (propertyId !== 'temp' && !isNaN(parseInt(propertyId))) {
        const mediaData = {
          propertyId: parseInt(propertyId),
          mediaType: uploadResponse.resource_type === 'video' ? 'video' as const : 'image' as const,
          cloudinaryId: uploadResponse.public_id,
          cloudinaryUrl: uploadResponse.secure_url,
          isFeatured: false,
          orderIndex: 0
        };

        newMedia = await storage.createPropertyMedia(mediaData);
      }
      
      res.json({
        success: true,
        media: newMedia,
        cloudinaryId: uploadResponse.public_id,
        cloudinaryUrl: uploadResponse.secure_url,
        mediaType: uploadResponse.resource_type === 'video' ? 'video' : 'image'
      });

    } catch (error) {
      console.error('❌ Media upload error:', error);
      res.status(500).json({ 
        error: "Failed to upload media",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Property Media Management - watermarked upload endpoint
  app.post("/api/admin/media/upload-watermarked", ensureAuthenticated, checkCloudinaryConfig, async (req: Request, res: Response) => {
    try {
      console.log("📨 Watermarked media upload request received");
      console.log("📋 Request body keys:", Object.keys(req.body));
      
      if (!req.body.fileData) {
        console.log("❌ No fileData found in request body");
        return res.status(400).json({ error: "No file data provided" });
      }

      const { fileData, fileName, propertyId, applyWatermark = true } = req.body;
      
      // Check file size (base64 data size estimation)
      const fileSizeBytes = Math.round((fileData.length * 3) / 4); // Base64 to bytes conversion
      const fileSizeMB = fileSizeBytes / (1024 * 1024);
      
      console.log(`📤 Uploading file: ${fileName} for property ${propertyId}`);
      console.log(`📊 File size: ${fileSizeMB.toFixed(2)}MB`);
      console.log(`🎨 Watermark enabled: ${applyWatermark}`);
      
      // File size limit check (100MB)
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
      
      // Determine if it's an image or video
      const isImage = fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i);
      const isVideo = fileName.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/i);
      
      // Validate file type
      if (!isImage && !isVideo) {
        console.log(`❌ Unsupported file type: ${fileName}`);
        return res.status(400).json({ 
          error: "Unsupported file type",
          details: "Please upload images (JPG, PNG, GIF, WebP) or videos (MP4, MOV, AVI, MKV, WebM)",
          fileName
        });
      }
      
      let uploadOptions: any = {
        folder: "south-delhi-realty",
        public_id: `property-${propertyId}-${Date.now()}`,
        resource_type: "auto"
      };
      
      // Apply watermark for both images and videos
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
        } else if (isVideo) {
          console.log("🎨 Applying SOUTH DELHI REALTY watermark to video");
          
          // For large videos (>20MB), use eager transformations with async processing
          const isLargeVideo = fileSizeMB > 20;
          
          const videoTransformation = [
            {
              overlay: {
                font_family: "Arial",
                font_size: 60, // Larger font for videos
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
            // Use eager transformations for large videos
            uploadOptions.eager = videoTransformation;
            uploadOptions.eager_async = true;
            uploadOptions.eager_notification_url = `${req.protocol}://${req.get('host')}/api/webhooks/cloudinary`;
          } else {
            console.log(`🎬 Small video (${fileSizeMB.toFixed(2)}MB), using sync processing`);
            uploadOptions.transformation = videoTransformation;
          }
        }
      }
      
      const uploadResponse = await cloudinary.uploader.upload(fileData, uploadOptions);

      console.log('✅ Cloudinary upload successful:', uploadResponse.public_id);
      console.log('🎨 Watermark applied:', (isImage || isVideo) && applyWatermark ? 'Yes' : 'No');
      console.log('📄 Media type:', uploadResponse.resource_type);

      // Check if this is a large video with async processing
      const isLargeVideo = isVideo && fileSizeMB > 20 && applyWatermark;
      
      // Only save to database if this is for an existing property (not "temp")
      let newMedia = null;
      if (propertyId !== 'temp' && !isNaN(parseInt(propertyId))) {
        const mediaData = {
          propertyId: parseInt(propertyId),
          mediaType: uploadResponse.resource_type === 'video' ? 'video' as const : 'image' as const,
          cloudinaryId: uploadResponse.public_id,
          cloudinaryUrl: uploadResponse.secure_url,
          isFeatured: false,
          orderIndex: 0
        };

        newMedia = await storage.createPropertyMedia(mediaData);
      }
      
      const response = {
        success: true,
        media: newMedia,
        cloudinaryId: uploadResponse.public_id,
        cloudinaryUrl: uploadResponse.secure_url,
        mediaType: uploadResponse.resource_type === 'video' ? 'video' : 'image',
        watermarkApplied: (isImage || isVideo) && applyWatermark,
        fileSizeMB: Math.round(fileSizeMB * 100) / 100,
        // Add processing status for large videos
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

    } catch (error) {
      console.error('❌ Watermarked media upload error:', error);
      
      // Handle specific errors
      if (error instanceof Error) {
        // Cloudinary specific errors
        if (error.message.includes('File size too large')) {
          return res.status(413).json({ 
            error: "File too large for Cloudinary",
            details: "The file exceeds Cloudinary's upload limits. Please compress your video or use a smaller file.",
            suggestion: "Try reducing video resolution or duration"
          });
        }
        
        // Network/timeout errors
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
  });

  // Multiple file upload endpoint
  app.post("/api/admin/media/upload-multiple", ensureAuthenticated, checkCloudinaryConfig, upload.array('files', 10), (req: Request, res: Response): void => {
    try {
      const uploadedFiles = req.files as CloudinaryFile[];
      
      if (!uploadedFiles || uploadedFiles.length === 0) {
        res.status(400).json({ error: "No files uploaded" });
        return;
      }

      const validFiles = uploadedFiles.filter((file: CloudinaryFile) => file.cloudinaryId && file.cloudinaryUrl);

      res.json({
        success: true,
        message: `${validFiles.length} files uploaded successfully`,
        files: validFiles.map((file: CloudinaryFile) => ({
          cloudinaryId: file.cloudinaryId,
          cloudinaryUrl: file.cloudinaryUrl,
          originalName: file.originalname
        }))
      });

    } catch (error) {
      console.error('Multiple upload error:', error);
      res.status(500).json({ 
        error: "Failed to upload files",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/admin/properties/:propertyId/media", ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
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
      const media = await storage.createPropertyMedia(mediaData);
      console.log('✅ Created individual media with ID:', media.id);
      
      const response = media;
      console.log('✅ Individual media upload completed:', response);
      res.status(201).json(response);
    } catch (error) {
      console.error('❌ Individual media upload error:', error);
      next(error);
    }
  });
  
  // Add multiple media files at once to a property
  app.post("/api/admin/properties/:propertyId/media/batch", ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('📤 Media batch upload started for property:', req.params.propertyId);
      console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
      
      const propertyId = parseInt(req.params.propertyId);
      if (isNaN(propertyId)) {
        console.log('❌ Invalid property ID:', req.params.propertyId);
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      // Validate that the request body contains an array of media items
      if (!Array.isArray(req.body)) {
        console.log('❌ Request body is not an array:', typeof req.body);
        return res.status(400).json({ message: "Expected an array of media items" });
      }
      
      const results = [];
      const errors = [];
      
      // Process each media item
      for (let i = 0; i < req.body.length; i++) {
        const mediaItem = req.body[i];
        console.log(`📸 Processing media item ${i + 1}/${req.body.length}:`, mediaItem);
        
        try {
          // Add property ID to each item
          const mediaData = {
            ...mediaItem,
            propertyId,
            // If orderIndex is not provided, use the array index
            orderIndex: mediaItem.orderIndex !== undefined ? mediaItem.orderIndex : i
          };
          
          console.log(`💾 Creating media with data:`, mediaData);
          const media = await storage.createPropertyMedia(mediaData);
          console.log(`✅ Created media with ID:`, media.id);
          results.push(media);
        } catch (error) {
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
    } catch (error) {
      console.error('❌ Media batch upload error:', error);
      next(error);
    }
  });

  app.delete("/api/admin/media/:id", ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      console.log(`🗑️ DELETE request for media ID: ${id}`);
      
      // Get media details first by querying the media table directly
      const mediaItems = await db.select().from(propertyMedia).where(eq(propertyMedia.id, id));
      
      if (mediaItems.length === 0) {
        console.log(`❌ Media ID ${id} not found in database`);
        return res.status(404).json({ message: "Media not found" });
      }
      
      const mediaItem = mediaItems[0];
      console.log(`✅ Found media: ${mediaItem.cloudinaryId}`);
      
      // Delete from database
      const deleted = await storage.deletePropertyMedia(id);
      
      if (deleted) {
        // Delete from Cloudinary
        try {
          const resourceType = mediaItem.mediaType === 'video' ? 'video' : 'image';
          console.log(`🗑️ Deleting from Cloudinary: ${mediaItem.cloudinaryId} (${resourceType})`);
          await deleteFromCloudinary(mediaItem.cloudinaryId, resourceType);
          console.log(`✅ Successfully deleted from Cloudinary`);
        } catch (cloudinaryErr) {
          console.error('❌ Error deleting from Cloudinary:', cloudinaryErr);
          // Still return success since DB record is deleted
        }
        
        console.log(`✅ Media ${id} deleted successfully`);
        res.json({ message: "Media deleted successfully" });
      } else {
        console.log(`❌ Failed to delete media ${id} from database`);
        res.status(404).json({ message: "Media not found" });
      }
    } catch (error) {
      console.error('❌ Error in DELETE media endpoint:', error);
      next(error);
    }
  });

  app.put("/api/admin/properties/:propertyId/media/:id/featured", ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const propertyId = parseInt(req.params.propertyId);
      
      if (isNaN(id) || isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const updated = await storage.setFeaturedMedia(id, propertyId);
      
      if (updated) {
        res.json({ message: "Featured media updated successfully" });
      } else {
        res.status(404).json({ message: "Media not found" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Nearby Facilities
  app.post("/api/admin/properties/:propertyId/facilities", ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      if (isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid property ID" });
      }
      
      // Get the property to check its coordinates
      const property = await storage.getPropertyById(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      let facilityData = {
        ...req.body,
        propertyId
      };
      
      // Calculate distanceValue in meters if not provided
      if (!facilityData.distanceValue && facilityData.distance) {
        // Try to extract numeric value from distance string (e.g., "2.5 km" -> 2.5)
        const distanceMatch = facilityData.distance.match(/^(\d+(\.\d+)?)/);
        if (distanceMatch) {
          const distanceNumeric = parseFloat(distanceMatch[1]);
          
          // Check if it contains "km" or assume kilometers
          if (facilityData.distance.toLowerCase().includes("km")) {
            facilityData.distanceValue = Math.round(distanceNumeric * 1000); // km to meters
          } else if (facilityData.distance.toLowerCase().includes("m")) {
            facilityData.distanceValue = Math.round(distanceNumeric); // already in meters
          } else {
            // Default to kilometers
            facilityData.distanceValue = Math.round(distanceNumeric * 1000);
          }
        }
      }
      
      // If we have lat/lng for both the property and facility, we can calculate the distance
      if (
        property.latitude && property.longitude && 
        facilityData.latitude && facilityData.longitude &&
        !facilityData.distanceValue
      ) {
        try {
          // Calculate distance using Haversine formula
          const R = 6371e3; // Earth's radius in meters
          const φ1 = parseFloat(property.latitude) * Math.PI/180;
          const φ2 = parseFloat(facilityData.latitude) * Math.PI/180;
          const Δφ = (parseFloat(facilityData.latitude) - parseFloat(property.latitude)) * Math.PI/180;
          const Δλ = (parseFloat(facilityData.longitude) - parseFloat(property.longitude)) * Math.PI/180;
          
          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          
          const distanceInMeters = Math.round(R * c);
          facilityData.distanceValue = distanceInMeters;
          
          // If no distance text was provided, also generate that
          if (!facilityData.distance) {
            if (distanceInMeters < 1000) {
              facilityData.distance = `${distanceInMeters} m`;
            } else {
              facilityData.distance = `${(distanceInMeters / 1000).toFixed(1)} km`;
            }
          }
        } catch (error) {
          console.error("Error calculating distance:", error);
          // Continue without calculated distance
        }
      }
      
      const validatedData = insertNearbyFacilitySchema.parse(facilityData);
      const facility = await storage.createNearbyFacility(validatedData);
      res.status(201).json(facility);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/facilities/:id", ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const deleted = await storage.deleteNearbyFacility(id);
      
      if (deleted) {
        res.json({ message: "Facility deleted successfully" });
      } else {
        res.status(404).json({ message: "Facility not found" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Inquiry Management
  app.get("/api/admin/inquiries", ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: any = {};
      
      if (req.query.propertyId) {
        filters.propertyId = parseInt(req.query.propertyId as string);
      }
      
      if (req.query.status) {
        filters.status = req.query.status;
      }
      
      const inquiries = await storage.getInquiries(filters);
      res.json(inquiries);
    } catch (error) {
      next(error);
    }
  });

  // Temporary debugging endpoint to see all inquiry IDs (public)
  app.get("/api/debug/inquiry-ids", async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('🔍 Debug endpoint called - fetching all inquiry IDs');
      const inquiries = await storage.getInquiries();
      const inquiryIds = inquiries.map(inquiry => ({
        id: inquiry.id,
        name: inquiry.name,
        email: inquiry.email,
        createdAt: inquiry.createdAt
      }));
      console.log('🔍 Found inquiry IDs:', inquiryIds.map(i => i.id));
      res.json(inquiryIds);
    } catch (error) {
      console.error('🔍 Error in debug endpoint:', error);
      next(error);
    }
  });

  app.put("/api/admin/inquiries/:id", ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      if (!req.body.status || !['new', 'contacted', 'resolved'].includes(req.body.status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const inquiry = await storage.updateInquiryStatus(id, req.body.status);
      
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      res.json(inquiry);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/inquiries/:id", ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
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
      const deleted = await storage.deleteInquiry(id);
      console.log(`🗑️ storage.deleteInquiry(${id}) returned:`, deleted);
      
      if (deleted) {
        console.log(`✅ Inquiry ${id} deleted successfully`);
        res.json({ message: "Inquiry deleted successfully" });
      } else {
        console.log(`❌ Inquiry ${id} not found or could not be deleted`);
        res.status(404).json({ message: "Inquiry not found" });
      }
    } catch (error) {
      console.error(`❌ Error in DELETE /api/admin/inquiries/:id:`, error);
      next(error);
    }
  });

  // Email Testing Routes - Admin only
  app.get("/api/admin/email/test-config", ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('🧪 Testing email configuration...');
      // Test email configuration would go here
      const result = { success: true, message: 'Email configuration test not implemented' };
      res.json(result);
    } catch (error) {
      console.error('❌ Email config test error:', error);
      next(error);
    }
  });

  app.post("/api/admin/email/send-test", ensureAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('📧 Sending test email...');
      // Send test email would go here
      const result = { success: true, message: 'Test email send not implemented' };
      res.json(result);
    } catch (error) {
      console.error('❌ Test email send error:', error);
      next(error);
    }
  });

  // Cloudinary webhook for async transformation notifications
  app.post("/api/webhooks/cloudinary", async (req: Request, res: Response) => {
    try {
      console.log("🔗 Cloudinary webhook received");
      console.log("📋 Webhook data:", JSON.stringify(req.body, null, 2));
      
      // Verify the webhook (optional - you can add signature verification here if needed)
      const { notification_type, public_id, eager } = req.body;
      
      if (notification_type === 'eager' && public_id) {
        console.log(`✅ Async transformation completed for: ${public_id}`);
        
        if (eager && eager.length > 0) {
          console.log(`🎬 Video watermarking completed successfully`);
          console.log(`📄 Eager transformations: ${eager.length}`);
        }
      }
      
      // Respond to Cloudinary to acknowledge receipt
      res.status(200).json({ success: true, message: "Webhook received" });
    } catch (error) {
      console.error("❌ Error processing Cloudinary webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  return httpServer;
}
