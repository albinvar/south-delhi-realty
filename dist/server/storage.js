"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.DatabaseStorage = void 0;
const schema_1 = require("../shared/schema");
const drizzle_orm_1 = require("drizzle-orm");
const express_session_1 = __importDefault(require("express-session"));
const memorystore_1 = __importDefault(require("memorystore"));
const db_1 = require("./db");
const MemoryStore = (0, memorystore_1.default)(express_session_1.default);
const sessionStore = new MemoryStore({
    checkPeriod: 86400000,
    max: 1000,
    ttl: 86400000,
    stale: false,
    dispose: (key, value) => {
        console.log(`Session expired: ${key}`);
    },
    noDisposeOnSet: true
});
async function withRetry(operation, maxRetries = 5, baseDelay = 2000, operationName = 'database operation') {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await Promise.race([
                operation(),
                new Promise((_, reject) => setTimeout(() => reject(new Error(`${operationName} timeout after 30 seconds`)), 30000))
            ]);
            if (attempt > 1) {
                console.log(`✅ ${operationName} succeeded on attempt ${attempt}`);
            }
            return result;
        }
        catch (error) {
            lastError = error;
            console.error(`❌ ${operationName} failed on attempt ${attempt}:`, {
                message: error.message,
                code: error.code,
                errno: error.errno,
                sqlState: error.sqlState
            });
            const retryableErrors = [
                'ETIMEDOUT',
                'ECONNRESET',
                'ECONNREFUSED',
                'ENOTFOUND',
                'EPIPE',
                'ECONNABORTED'
            ];
            if (!retryableErrors.includes(error.code) && !error.message.includes('timeout')) {
                console.error(`🚫 Non-retryable error for ${operationName}:`, error.code);
                throw error;
            }
            if (attempt === maxRetries) {
                console.error(`💥 ${operationName} failed after ${maxRetries} attempts`);
                console.error(`🔧 Final error details:`, {
                    message: error.message,
                    code: error.code,
                    sqlState: error.sqlState
                });
                throw new Error(`${operationName} failed after ${maxRetries} attempts: ${error.message}`);
            }
            const delay = Math.min(baseDelay * Math.pow(1.5, attempt - 1), 10000);
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
class DatabaseStorage {
    sessionStore;
    constructor() {
        this.sessionStore = sessionStore;
    }
    async getUser(id) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        return user;
    }
    async findUserById(id) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        return user;
    }
    async findUserByUsername(username) {
        return withRetry(async () => {
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username)).limit(1);
            return user;
        }, 3, 1000, `findUserByUsername(${username})`);
    }
    async findUserByEmail(email) {
        return withRetry(async () => {
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).limit(1);
            return user;
        }, 3, 1000, `findUserByEmail(${email})`);
    }
    async findUserByGoogleId(googleId) {
        return withRetry(async () => {
            const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.googleId, googleId)).limit(1);
            return user;
        }, 3, 1000, `findUserByGoogleId(${googleId})`);
    }
    async getUserByUsername(username) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
        return user;
    }
    async getUserByEmail(email) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        return user;
    }
    async createUser(userData) {
        const insertUser = {
            email: userData.email,
            username: userData.username,
            password: userData.password,
            role: userData.role || 'admin'
        };
        const result = await db_1.db.insert(schema_1.users).values(insertUser);
        const insertId = result[0].insertId;
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, Number(insertId)));
        return user;
    }
    async createGoogleUser(userData) {
        const insertUser = {
            email: userData.email,
            username: userData.username,
            password: '',
            role: userData.role,
            googleId: userData.googleId
        };
        const result = await db_1.db.insert(schema_1.users).values(insertUser);
        const insertId = result[0].insertId;
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, Number(insertId)));
        return user;
    }
    async linkGoogleAccount(userId, googleId) {
        await db_1.db.update(schema_1.users).set({ googleId }).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
    }
    async deleteUser(id) {
        try {
            const existingUser = await db_1.db.select({ id: schema_1.users.id })
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
                .limit(1);
            if (existingUser.length === 0) {
                return false;
            }
            const result = await db_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
            const checkUser = await db_1.db.select({ id: schema_1.users.id })
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
                .limit(1);
            return checkUser.length === 0;
        }
        catch (error) {
            console.error('Error deleting user:', error);
            return false;
        }
    }
    async getProperties(filters) {
        let query = db_1.db.select({
            id: schema_1.properties.id,
            title: schema_1.properties.title,
            slug: schema_1.properties.slug,
            description: schema_1.properties.description,
            status: schema_1.properties.status,
            category: schema_1.properties.category,
            propertyType: schema_1.properties.propertyType,
            subType: schema_1.properties.subType,
            portion: schema_1.properties.portion,
            area: schema_1.properties.area,
            areaUnit: schema_1.properties.areaUnit,
            furnishedStatus: schema_1.properties.furnishedStatus,
            bedrooms: schema_1.properties.bedrooms,
            bathrooms: schema_1.properties.bathrooms,
            balconies: schema_1.properties.balconies,
            facing: schema_1.properties.facing,
            parking: schema_1.properties.parking,
            age: schema_1.properties.age,
            price: schema_1.properties.price,
            priceNegotiable: schema_1.properties.priceNegotiable,
            brokerage: schema_1.properties.brokerage,
            contactDetails: schema_1.properties.contactDetails,
            latitude: schema_1.properties.latitude,
            longitude: schema_1.properties.longitude,
            isActive: schema_1.properties.isActive,
            createdAt: schema_1.properties.createdAt,
            updatedAt: schema_1.properties.updatedAt,
        }).from(schema_1.properties);
        if (filters) {
            const conditions = [];
            if (filters.isActive !== undefined) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.properties.isActive, filters.isActive));
            }
            if (conditions.length > 0) {
                query = query.where((0, drizzle_orm_1.and)(...conditions));
            }
        }
        query = query.orderBy((0, drizzle_orm_1.desc)(schema_1.properties.createdAt));
        const propertyList = await query;
        const propertiesWithMedia = [];
        for (const property of propertyList) {
            const propertyMediaItems = await db_1.db.select().from(schema_1.propertyMedia)
                .where((0, drizzle_orm_1.eq)(schema_1.propertyMedia.propertyId, property.id))
                .orderBy(schema_1.propertyMedia.orderIndex);
            propertiesWithMedia.push({
                ...property,
                media: propertyMediaItems
            });
        }
        return propertiesWithMedia;
    }
    async getPropertiesWithPagination(filters) {
        return withRetry(async () => {
            let query = db_1.db.select({
                id: schema_1.properties.id,
                title: schema_1.properties.title,
                slug: schema_1.properties.slug,
                description: schema_1.properties.description,
                status: schema_1.properties.status,
                category: schema_1.properties.category,
                propertyType: schema_1.properties.propertyType,
                subType: schema_1.properties.subType,
                portion: schema_1.properties.portion,
                area: schema_1.properties.area,
                areaUnit: schema_1.properties.areaUnit,
                furnishedStatus: schema_1.properties.furnishedStatus,
                bedrooms: schema_1.properties.bedrooms,
                bathrooms: schema_1.properties.bathrooms,
                balconies: schema_1.properties.balconies,
                facing: schema_1.properties.facing,
                parking: schema_1.properties.parking,
                age: schema_1.properties.age,
                price: schema_1.properties.price,
                priceNegotiable: schema_1.properties.priceNegotiable,
                brokerage: schema_1.properties.brokerage,
                contactDetails: schema_1.properties.contactDetails,
                latitude: schema_1.properties.latitude,
                longitude: schema_1.properties.longitude,
                isActive: schema_1.properties.isActive,
                createdAt: schema_1.properties.createdAt,
                updatedAt: schema_1.properties.updatedAt,
            }).from(schema_1.properties);
            let countQuery = db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.properties);
            console.log("Enhanced pagination filters received:", filters);
            const conditions = [];
            conditions.push((0, drizzle_orm_1.eq)(schema_1.properties.isActive, true));
            if (filters?.status && filters.status !== 'all') {
                if (filters.status === 'sale' || filters.status === 'rent') {
                    conditions.push((0, drizzle_orm_1.eq)(schema_1.properties.status, filters.status));
                }
            }
            if (filters?.category && filters.category !== 'all') {
                if (filters.category === 'residential' || filters.category === 'commercial') {
                    conditions.push((0, drizzle_orm_1.eq)(schema_1.properties.category, filters.category));
                }
            }
            if (filters?.propertyType && filters.propertyType !== 'all') {
                if (['apartment', 'independent-house', 'villa', 'farm-house', 'shop', 'basement'].includes(filters.propertyType)) {
                    conditions.push((0, drizzle_orm_1.eq)(schema_1.properties.propertyType, filters.propertyType));
                }
            }
            if (filters?.subType && filters.subType !== 'all') {
                if (['1rk', '1bhk', '2bhk', '3bhk', '4bhk', 'plot', 'other'].includes(filters.subType)) {
                    conditions.push((0, drizzle_orm_1.eq)(schema_1.properties.subType, filters.subType));
                }
            }
            if (filters?.minPrice && filters.minPrice > 0) {
                conditions.push((0, drizzle_orm_1.gte)(schema_1.properties.price, filters.minPrice));
            }
            if (filters?.maxPrice && filters.maxPrice > 0) {
                conditions.push((0, drizzle_orm_1.lte)(schema_1.properties.price, filters.maxPrice));
            }
            if (filters?.minArea && filters.minArea > 0) {
                conditions.push((0, drizzle_orm_1.gte)(schema_1.properties.area, filters.minArea));
            }
            if (filters?.maxArea && filters.maxArea > 0) {
                conditions.push((0, drizzle_orm_1.lte)(schema_1.properties.area, filters.maxArea));
            }
            if (filters?.bedrooms && filters.bedrooms > 0) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.properties.bedrooms, filters.bedrooms));
            }
            if (filters?.bathrooms && filters.bathrooms > 0) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.properties.bathrooms, filters.bathrooms));
            }
            if (filters?.furnishedStatus && filters.furnishedStatus !== 'all') {
                if (['furnished', 'semi-furnished', 'unfurnished'].includes(filters.furnishedStatus)) {
                    conditions.push((0, drizzle_orm_1.eq)(schema_1.properties.furnishedStatus, filters.furnishedStatus));
                }
            }
            if (filters?.parking && filters.parking !== 'all') {
                if (['car', 'two-wheeler', 'both', 'none'].includes(filters.parking)) {
                    conditions.push((0, drizzle_orm_1.eq)(schema_1.properties.parking, filters.parking));
                }
            }
            if (filters?.facing && filters.facing !== 'all') {
                if (['east', 'west', 'north', 'south', 'road', 'park', 'greenery'].includes(filters.facing)) {
                    conditions.push((0, drizzle_orm_1.eq)(schema_1.properties.facing, filters.facing));
                }
            }
            if (filters?.search && filters.search.trim()) {
                const searchTerm = `%${filters.search.trim()}%`;
                conditions.push((0, drizzle_orm_1.sql) `(${schema_1.properties.title} LIKE ${searchTerm} OR ${schema_1.properties.description} LIKE ${searchTerm})`);
            }
            if (conditions.length > 0) {
                query = query.where((0, drizzle_orm_1.and)(...conditions));
                countQuery = countQuery.where((0, drizzle_orm_1.and)(...conditions));
            }
            const [countResult] = await countQuery;
            const total = Number(countResult.count);
            query = query.orderBy((0, drizzle_orm_1.desc)(schema_1.properties.createdAt));
            const page = filters?.page || 1;
            const limit = filters?.limit || 9;
            const offset = (page - 1) * limit;
            query = query.limit(limit).offset(offset);
            const propertyList = await query;
            console.log(`Found ${propertyList.length} properties out of ${total} total after enhanced filtering`);
            const propertiesWithMedia = [];
            for (const property of propertyList) {
                const propertyMediaItems = await db_1.db.select().from(schema_1.propertyMedia)
                    .where((0, drizzle_orm_1.eq)(schema_1.propertyMedia.propertyId, property.id))
                    .orderBy(schema_1.propertyMedia.orderIndex);
                propertiesWithMedia.push({
                    ...property,
                    media: propertyMediaItems
                });
            }
            return {
                properties: propertiesWithMedia,
                total
            };
        }, 3, 1000, 'getPropertiesWithPagination');
    }
    async getPropertyById(id) {
        const [property] = await db_1.db.select({
            id: schema_1.properties.id,
            title: schema_1.properties.title,
            slug: schema_1.properties.slug,
            description: schema_1.properties.description,
            status: schema_1.properties.status,
            category: schema_1.properties.category,
            propertyType: schema_1.properties.propertyType,
            subType: schema_1.properties.subType,
            portion: schema_1.properties.portion,
            area: schema_1.properties.area,
            areaUnit: schema_1.properties.areaUnit,
            furnishedStatus: schema_1.properties.furnishedStatus,
            bedrooms: schema_1.properties.bedrooms,
            bathrooms: schema_1.properties.bathrooms,
            balconies: schema_1.properties.balconies,
            facing: schema_1.properties.facing,
            parking: schema_1.properties.parking,
            age: schema_1.properties.age,
            price: schema_1.properties.price,
            priceNegotiable: schema_1.properties.priceNegotiable,
            brokerage: schema_1.properties.brokerage,
            contactDetails: schema_1.properties.contactDetails,
            latitude: schema_1.properties.latitude,
            longitude: schema_1.properties.longitude,
            isActive: schema_1.properties.isActive,
            createdAt: schema_1.properties.createdAt,
            updatedAt: schema_1.properties.updatedAt,
        }).from(schema_1.properties).where((0, drizzle_orm_1.eq)(schema_1.properties.id, id));
        if (!property)
            return undefined;
        const propertyMediaItems = await db_1.db.select().from(schema_1.propertyMedia).where((0, drizzle_orm_1.eq)(schema_1.propertyMedia.propertyId, id));
        const propertyFacilities = await db_1.db.select().from(schema_1.nearbyFacilities).where((0, drizzle_orm_1.eq)(schema_1.nearbyFacilities.propertyId, id));
        return {
            ...property,
            media: propertyMediaItems,
            facilities: propertyFacilities
        };
    }
    async getPropertyBySlug(slug) {
        const [property] = await db_1.db.select({
            id: schema_1.properties.id,
            title: schema_1.properties.title,
            slug: schema_1.properties.slug,
            description: schema_1.properties.description,
            status: schema_1.properties.status,
            category: schema_1.properties.category,
            propertyType: schema_1.properties.propertyType,
            subType: schema_1.properties.subType,
            portion: schema_1.properties.portion,
            area: schema_1.properties.area,
            areaUnit: schema_1.properties.areaUnit,
            furnishedStatus: schema_1.properties.furnishedStatus,
            bedrooms: schema_1.properties.bedrooms,
            bathrooms: schema_1.properties.bathrooms,
            balconies: schema_1.properties.balconies,
            facing: schema_1.properties.facing,
            parking: schema_1.properties.parking,
            age: schema_1.properties.age,
            price: schema_1.properties.price,
            priceNegotiable: schema_1.properties.priceNegotiable,
            brokerage: schema_1.properties.brokerage,
            contactDetails: schema_1.properties.contactDetails,
            latitude: schema_1.properties.latitude,
            longitude: schema_1.properties.longitude,
            isActive: schema_1.properties.isActive,
            createdAt: schema_1.properties.createdAt,
            updatedAt: schema_1.properties.updatedAt,
        }).from(schema_1.properties).where((0, drizzle_orm_1.eq)(schema_1.properties.slug, slug));
        if (!property)
            return undefined;
        const propertyMediaItems = await db_1.db.select().from(schema_1.propertyMedia).where((0, drizzle_orm_1.eq)(schema_1.propertyMedia.propertyId, property.id));
        const propertyFacilities = await db_1.db.select().from(schema_1.nearbyFacilities).where((0, drizzle_orm_1.eq)(schema_1.nearbyFacilities.propertyId, property.id));
        return {
            ...property,
            media: propertyMediaItems,
            facilities: propertyFacilities
        };
    }
    async createProperty(propertyData) {
        const result = await db_1.db.insert(schema_1.properties).values(propertyData);
        const insertId = result[0].insertId;
        const [newProperty] = await db_1.db.select({
            id: schema_1.properties.id,
            title: schema_1.properties.title,
            slug: schema_1.properties.slug,
            description: schema_1.properties.description,
            status: schema_1.properties.status,
            category: schema_1.properties.category,
            propertyType: schema_1.properties.propertyType,
            subType: schema_1.properties.subType,
            portion: schema_1.properties.portion,
            area: schema_1.properties.area,
            areaUnit: schema_1.properties.areaUnit,
            furnishedStatus: schema_1.properties.furnishedStatus,
            bedrooms: schema_1.properties.bedrooms,
            bathrooms: schema_1.properties.bathrooms,
            balconies: schema_1.properties.balconies,
            facing: schema_1.properties.facing,
            parking: schema_1.properties.parking,
            age: schema_1.properties.age,
            price: schema_1.properties.price,
            priceNegotiable: schema_1.properties.priceNegotiable,
            brokerage: schema_1.properties.brokerage,
            contactDetails: schema_1.properties.contactDetails,
            latitude: schema_1.properties.latitude,
            longitude: schema_1.properties.longitude,
            isActive: schema_1.properties.isActive,
            createdAt: schema_1.properties.createdAt,
            updatedAt: schema_1.properties.updatedAt,
        }).from(schema_1.properties).where((0, drizzle_orm_1.eq)(schema_1.properties.id, Number(insertId)));
        if (!newProperty) {
            throw new Error("Failed to create property");
        }
        return {
            ...newProperty,
            media: []
        };
    }
    async updateProperty(id, updates) {
        try {
            const existingProperty = await db_1.db.select({
                id: schema_1.properties.id,
                updatedAt: schema_1.properties.updatedAt
            })
                .from(schema_1.properties)
                .where((0, drizzle_orm_1.eq)(schema_1.properties.id, id))
                .limit(1);
            if (existingProperty.length === 0) {
                return false;
            }
            const originalUpdatedAt = existingProperty[0].updatedAt;
            const result = await db_1.db.update(schema_1.properties).set(updates).where((0, drizzle_orm_1.eq)(schema_1.properties.id, id));
            const updatedProperty = await db_1.db.select({
                id: schema_1.properties.id,
                updatedAt: schema_1.properties.updatedAt
            })
                .from(schema_1.properties)
                .where((0, drizzle_orm_1.eq)(schema_1.properties.id, id))
                .limit(1);
            if (updatedProperty.length === 0) {
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Error updating property:', error);
            return false;
        }
    }
    async deleteProperty(id) {
        try {
            const existingProperty = await db_1.db.select({ id: schema_1.properties.id })
                .from(schema_1.properties)
                .where((0, drizzle_orm_1.eq)(schema_1.properties.id, id))
                .limit(1);
            if (existingProperty.length === 0) {
                return false;
            }
            const result = await db_1.db.delete(schema_1.properties).where((0, drizzle_orm_1.eq)(schema_1.properties.id, id));
            const checkProperty = await db_1.db.select({ id: schema_1.properties.id })
                .from(schema_1.properties)
                .where((0, drizzle_orm_1.eq)(schema_1.properties.id, id))
                .limit(1);
            return checkProperty.length === 0;
        }
        catch (error) {
            console.error('Error deleting property:', error);
            return false;
        }
    }
    async getPropertyMedia(propertyId) {
        return await db_1.db.select().from(schema_1.propertyMedia)
            .where((0, drizzle_orm_1.eq)(schema_1.propertyMedia.propertyId, propertyId))
            .orderBy(schema_1.propertyMedia.orderIndex);
    }
    async createPropertyMedia(mediaData) {
        const result = await db_1.db.insert(schema_1.propertyMedia).values(mediaData);
        const insertId = result[0].insertId;
        const [newMedia] = await db_1.db.select().from(schema_1.propertyMedia).where((0, drizzle_orm_1.eq)(schema_1.propertyMedia.id, Number(insertId)));
        return newMedia;
    }
    async deletePropertyMedia(id) {
        try {
            const existingMedia = await db_1.db.select({ id: schema_1.propertyMedia.id })
                .from(schema_1.propertyMedia)
                .where((0, drizzle_orm_1.eq)(schema_1.propertyMedia.id, id))
                .limit(1);
            if (existingMedia.length === 0) {
                return false;
            }
            const result = await db_1.db.delete(schema_1.propertyMedia).where((0, drizzle_orm_1.eq)(schema_1.propertyMedia.id, id));
            const checkMedia = await db_1.db.select({ id: schema_1.propertyMedia.id })
                .from(schema_1.propertyMedia)
                .where((0, drizzle_orm_1.eq)(schema_1.propertyMedia.id, id))
                .limit(1);
            return checkMedia.length === 0;
        }
        catch (error) {
            console.error('Error deleting property media:', error);
            return false;
        }
    }
    async setFeaturedMedia(id, propertyId) {
        await db_1.db.update(schema_1.propertyMedia).set({ isFeatured: false }).where((0, drizzle_orm_1.eq)(schema_1.propertyMedia.propertyId, propertyId));
        const result = await db_1.db.update(schema_1.propertyMedia).set({ isFeatured: true }).where((0, drizzle_orm_1.eq)(schema_1.propertyMedia.id, id));
        return result.affectedRows > 0;
    }
    async getNearbyFacilities(propertyId) {
        return await db_1.db.select().from(schema_1.nearbyFacilities)
            .where((0, drizzle_orm_1.eq)(schema_1.nearbyFacilities.propertyId, propertyId));
    }
    async createNearbyFacility(facilityData) {
        const result = await db_1.db.insert(schema_1.nearbyFacilities).values(facilityData);
        const insertId = result[0].insertId;
        const [newFacility] = await db_1.db.select().from(schema_1.nearbyFacilities).where((0, drizzle_orm_1.eq)(schema_1.nearbyFacilities.id, Number(insertId)));
        return newFacility;
    }
    async deleteNearbyFacility(id) {
        try {
            const existingFacility = await db_1.db.select({ id: schema_1.nearbyFacilities.id })
                .from(schema_1.nearbyFacilities)
                .where((0, drizzle_orm_1.eq)(schema_1.nearbyFacilities.id, id))
                .limit(1);
            if (existingFacility.length === 0) {
                return false;
            }
            const result = await db_1.db.delete(schema_1.nearbyFacilities).where((0, drizzle_orm_1.eq)(schema_1.nearbyFacilities.id, id));
            const checkFacility = await db_1.db.select({ id: schema_1.nearbyFacilities.id })
                .from(schema_1.nearbyFacilities)
                .where((0, drizzle_orm_1.eq)(schema_1.nearbyFacilities.id, id))
                .limit(1);
            return checkFacility.length === 0;
        }
        catch (error) {
            console.error('Error deleting nearby facility:', error);
            return false;
        }
    }
    async getInquiries(filters) {
        try {
            let query = db_1.db.select().from(schema_1.inquiries);
            if (filters) {
                const conditions = [];
                if (filters.propertyId) {
                    conditions.push((0, drizzle_orm_1.eq)(schema_1.inquiries.propertyId, filters.propertyId));
                }
                if (filters.status) {
                    conditions.push((0, drizzle_orm_1.eq)(schema_1.inquiries.status, filters.status));
                }
                if (conditions.length > 0) {
                    query = query.where((0, drizzle_orm_1.and)(...conditions));
                }
            }
            const inquiriesResult = await query.orderBy((0, drizzle_orm_1.desc)(schema_1.inquiries.createdAt));
            console.log(`Found ${inquiriesResult.length} inquiries`);
            const propertyIds = inquiriesResult
                .filter(inquiry => inquiry.propertyId !== null && inquiry.propertyId !== undefined)
                .map(inquiry => inquiry.propertyId);
            console.log(`Need to fetch ${propertyIds.length} properties with IDs:`, propertyIds);
            let propertiesMap = {};
            if (propertyIds.length > 0) {
                const propertiesResult = await db_1.db.select({
                    id: schema_1.properties.id,
                    title: schema_1.properties.title,
                    slug: schema_1.properties.slug,
                    description: schema_1.properties.description,
                    status: schema_1.properties.status,
                    category: schema_1.properties.category,
                    propertyType: schema_1.properties.propertyType,
                    subType: schema_1.properties.subType,
                    portion: schema_1.properties.portion,
                    area: schema_1.properties.area,
                    areaUnit: schema_1.properties.areaUnit,
                    furnishedStatus: schema_1.properties.furnishedStatus,
                    bedrooms: schema_1.properties.bedrooms,
                    bathrooms: schema_1.properties.bathrooms,
                    balconies: schema_1.properties.balconies,
                    facing: schema_1.properties.facing,
                    parking: schema_1.properties.parking,
                    age: schema_1.properties.age,
                    price: schema_1.properties.price,
                    priceNegotiable: schema_1.properties.priceNegotiable,
                    brokerage: schema_1.properties.brokerage,
                    contactDetails: schema_1.properties.contactDetails,
                    latitude: schema_1.properties.latitude,
                    longitude: schema_1.properties.longitude,
                    isActive: schema_1.properties.isActive,
                    createdAt: schema_1.properties.createdAt,
                    updatedAt: schema_1.properties.updatedAt,
                }).from(schema_1.properties)
                    .where((0, drizzle_orm_1.inArray)(schema_1.properties.id, propertyIds));
                console.log(`Fetched ${propertiesResult.length} properties:`, propertiesResult.map(p => `ID: ${p.id}, Title: ${p.title}`));
                propertiesMap = propertiesResult.reduce((map, property) => {
                    map[property.id] = property;
                    return map;
                }, {});
            }
            const enrichedInquiries = inquiriesResult.map(inquiry => {
                if (inquiry.propertyId && propertiesMap[inquiry.propertyId]) {
                    const propertyData = propertiesMap[inquiry.propertyId];
                    console.log(`Attaching property "${propertyData.title}" to inquiry #${inquiry.id}`);
                    return {
                        ...inquiry,
                        property: propertyData
                    };
                }
                else if (inquiry.propertyId) {
                    console.log(`Warning: Property #${inquiry.propertyId} not found for inquiry #${inquiry.id}`);
                }
                return inquiry;
            });
            console.log(`Returning ${enrichedInquiries.length} inquiries with property data`);
            return enrichedInquiries;
        }
        catch (error) {
            console.error("Error fetching inquiries with properties:", error);
            throw error;
        }
    }
    async getInquiryById(id) {
        const [inquiry] = await db_1.db.select().from(schema_1.inquiries).where((0, drizzle_orm_1.eq)(schema_1.inquiries.id, id));
        return inquiry;
    }
    async createInquiry(inquiryData) {
        console.log('====== createInquiry method called ======');
        console.log('Inquiry data received:', JSON.stringify(inquiryData, null, 2));
        try {
            console.log('Inserting inquiry into database...');
            const result = await db_1.db.insert(schema_1.inquiries).values(inquiryData);
            console.log('Insert result:', result);
            const insertId = result[0].insertId;
            if (!insertId) {
                console.error('No insert ID returned after creation');
                throw new Error('Failed to create inquiry - no ID returned');
            }
            console.log('Fetching created inquiry with ID:', insertId);
            const [newInquiry] = await db_1.db.select().from(schema_1.inquiries).where((0, drizzle_orm_1.eq)(schema_1.inquiries.id, Number(insertId)));
            if (!newInquiry) {
                console.error('No inquiry found after creation with ID:', insertId);
                throw new Error('Failed to fetch created inquiry');
            }
            console.log('Created inquiry:', JSON.stringify(newInquiry, null, 2));
            console.log('====== createInquiry success ======');
            return newInquiry;
        }
        catch (error) {
            console.error('====== createInquiry error ======');
            console.error('Error type:', typeof error);
            console.error('Error message:', error instanceof Error ? error.message : String(error));
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            console.error('====== end error ======');
            throw error;
        }
    }
    async updateInquiryStatus(id, status) {
        try {
            console.log(`🔄 updateInquiryStatus called for ID: ${id}, status: ${status}`);
            const existingInquiry = await db_1.db.select().from(schema_1.inquiries).where((0, drizzle_orm_1.eq)(schema_1.inquiries.id, id)).limit(1);
            if (existingInquiry.length === 0) {
                console.log(`❌ Inquiry ${id} does not exist`);
                return null;
            }
            console.log(`✅ Inquiry ${id} exists, updating status to ${status}...`);
            await db_1.db.update(schema_1.inquiries).set({ status, updatedAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.inquiries.id, id));
            const [updatedInquiry] = await db_1.db.select().from(schema_1.inquiries).where((0, drizzle_orm_1.eq)(schema_1.inquiries.id, id));
            console.log(`✅ Inquiry ${id} updated successfully:`, updatedInquiry);
            return updatedInquiry;
        }
        catch (error) {
            console.error(`❌ Error updating inquiry ${id}:`, error);
            return null;
        }
    }
    async deleteInquiry(id) {
        try {
            console.log(`🗑️ deleteInquiry called for ID: ${id}`);
            console.log(`🔍 Checking if inquiry ${id} exists...`);
            const existingInquiry = await db_1.db.select({ id: schema_1.inquiries.id })
                .from(schema_1.inquiries)
                .where((0, drizzle_orm_1.eq)(schema_1.inquiries.id, id))
                .limit(1);
            console.log(`🔍 Query result for inquiry ${id}:`, existingInquiry);
            console.log(`🔍 Found ${existingInquiry.length} inquiries with ID ${id}`);
            if (existingInquiry.length === 0) {
                console.log(`❌ Inquiry ${id} does not exist in database`);
                return false;
            }
            console.log(`✅ Inquiry ${id} exists, proceeding with deletion...`);
            const result = await db_1.db.delete(schema_1.inquiries).where((0, drizzle_orm_1.eq)(schema_1.inquiries.id, id));
            console.log(`🗑️ Delete result for inquiry ${id}:`, result);
            const checkInquiry = await db_1.db.select({ id: schema_1.inquiries.id })
                .from(schema_1.inquiries)
                .where((0, drizzle_orm_1.eq)(schema_1.inquiries.id, id))
                .limit(1);
            console.log(`🔍 Post-deletion check for inquiry ${id}:`, checkInquiry);
            const wasDeleted = checkInquiry.length === 0;
            console.log(`🗑️ Inquiry ${id} deletion successful: ${wasDeleted}`);
            return wasDeleted;
        }
        catch (error) {
            console.error(`❌ Error deleting inquiry ${id}:`, error);
            return false;
        }
    }
    async getDashboardStats() {
        return withRetry(async () => {
            const totalProperties = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.properties);
            const propertiesForSale = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
                .from(schema_1.properties)
                .where((0, drizzle_orm_1.eq)(schema_1.properties.status, 'sale'));
            const propertiesForRent = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
                .from(schema_1.properties)
                .where((0, drizzle_orm_1.eq)(schema_1.properties.status, 'rent'));
            const newInquiries = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
                .from(schema_1.inquiries)
                .where((0, drizzle_orm_1.eq)(schema_1.inquiries.status, 'new'));
            return {
                totalProperties: Number(totalProperties[0].count),
                propertiesForSale: Number(propertiesForSale[0].count),
                propertiesForRent: Number(propertiesForRent[0].count),
                newInquiries: Number(newInquiries[0].count)
            };
        }, 3, 1000, 'getDashboardStats');
    }
    async getUsers() {
        return await db_1.db.select({
            id: schema_1.users.id,
            username: schema_1.users.username,
            email: schema_1.users.email,
            role: schema_1.users.role,
            googleId: schema_1.users.googleId,
            createdAt: schema_1.users.createdAt,
            updatedAt: schema_1.users.updatedAt,
        }).from(schema_1.users).orderBy(schema_1.users.id);
    }
    async updateUser(id, userData) {
        try {
            const existingUser = await db_1.db.select({ id: schema_1.users.id })
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
                .limit(1);
            if (existingUser.length === 0) {
                return undefined;
            }
            const result = await db_1.db.update(schema_1.users).set(userData).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
            const updatedUser = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
            if (updatedUser.length === 0) {
                return undefined;
            }
            return updatedUser[0];
        }
        catch (error) {
            console.error('Error updating user:', error);
            return undefined;
        }
    }
}
exports.DatabaseStorage = DatabaseStorage;
exports.storage = new DatabaseStorage();
