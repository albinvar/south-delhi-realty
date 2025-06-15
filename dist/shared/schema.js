"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertInquirySchema = exports.insertNearbyFacilitySchema = exports.insertPropertyMediaSchema = exports.insertPropertySchema = exports.insertUserSchema = exports.inquiriesRelations = exports.nearbyFacilitiesRelations = exports.propertyMediaRelations = exports.propertiesRelations = exports.inquiries = exports.nearbyFacilities = exports.propertyMedia = exports.properties = exports.users = exports.facilityTypeEnum = exports.inquiryStatusEnum = exports.mediaTypeEnum = exports.portionEnum = exports.parkingEnum = exports.facingEnum = exports.furnishedStatusEnum = exports.areaUnitEnum = exports.propertySubTypeEnum = exports.propertyTypeEnum = exports.propertyCategoryEnum = exports.propertyStatusEnum = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_zod_1 = require("drizzle-zod");
exports.propertyStatusEnum = (0, mysql_core_1.mysqlEnum)('property_status', ['sale', 'rent']);
exports.propertyCategoryEnum = (0, mysql_core_1.mysqlEnum)('property_category', ['residential', 'commercial']);
exports.propertyTypeEnum = (0, mysql_core_1.mysqlEnum)('property_type', ['apartment', 'independent-house', 'villa', 'farm-house', 'shop', 'basement']);
exports.propertySubTypeEnum = (0, mysql_core_1.mysqlEnum)('property_sub_type', ['1rk', '1bhk', '2bhk', '3bhk', '4bhk', 'plot', 'other']);
exports.areaUnitEnum = (0, mysql_core_1.mysqlEnum)('area_unit', ['sq-ft', 'sq-mt', 'sq-yd']);
exports.furnishedStatusEnum = (0, mysql_core_1.mysqlEnum)('furnished_status', ['furnished', 'semi-furnished', 'unfurnished']);
exports.facingEnum = (0, mysql_core_1.mysqlEnum)('facing', ['east', 'west', 'north', 'south', 'road', 'park', 'greenery']);
exports.parkingEnum = (0, mysql_core_1.mysqlEnum)('parking', ['car', 'two-wheeler', 'both', 'none']);
exports.portionEnum = (0, mysql_core_1.mysqlEnum)('portion', ['front', 'back', 'side', 'floor']);
exports.mediaTypeEnum = (0, mysql_core_1.mysqlEnum)('media_type', ['image', 'video']);
exports.inquiryStatusEnum = (0, mysql_core_1.mysqlEnum)('inquiry_status', ['new', 'contacted', 'resolved']);
exports.facilityTypeEnum = (0, mysql_core_1.mysqlEnum)('facility_type', ['school', 'hospital', 'market', 'park', 'metro', 'bus-stop', 'bank', 'atm', 'restaurant', 'gym', 'temple', 'mall', 'gas-station', 'other']);
exports.users = (0, mysql_core_1.mysqlTable)("users", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    username: (0, mysql_core_1.text)("username").notNull(),
    email: (0, mysql_core_1.text)("email").notNull(),
    password: (0, mysql_core_1.text)("password"),
    role: (0, mysql_core_1.text)("role").notNull().default("admin"),
    googleId: (0, mysql_core_1.text)("google_id"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.properties = (0, mysql_core_1.mysqlTable)("properties", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    title: (0, mysql_core_1.text)("title").notNull(),
    slug: (0, mysql_core_1.text)("slug").notNull(),
    description: (0, mysql_core_1.text)("description").notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ['sale', 'rent']).notNull(),
    category: (0, mysql_core_1.mysqlEnum)("category", ['residential', 'commercial']).notNull(),
    propertyType: (0, mysql_core_1.mysqlEnum)("property_type", ['apartment', 'independent-house', 'villa', 'farm-house', 'shop', 'basement']).notNull(),
    subType: (0, mysql_core_1.mysqlEnum)("sub_type", ['1rk', '1bhk', '2bhk', '3bhk', '4bhk', 'plot', 'other']),
    portion: (0, mysql_core_1.mysqlEnum)("property_portion", ['front', 'back', 'side', 'floor']),
    area: (0, mysql_core_1.int)("area").notNull(),
    areaUnit: (0, mysql_core_1.mysqlEnum)("area_unit", ['sq-ft', 'sq-mt', 'sq-yd']).notNull(),
    furnishedStatus: (0, mysql_core_1.mysqlEnum)("furnished_status", ['furnished', 'semi-furnished', 'unfurnished']),
    bedrooms: (0, mysql_core_1.int)("bedrooms"),
    bathrooms: (0, mysql_core_1.int)("bathrooms"),
    balconies: (0, mysql_core_1.int)("balconies"),
    facing: (0, mysql_core_1.mysqlEnum)("facing", ['east', 'west', 'north', 'south', 'road', 'park', 'greenery']),
    parking: (0, mysql_core_1.mysqlEnum)("parking", ['car', 'two-wheeler', 'both', 'none']),
    age: (0, mysql_core_1.int)("age"),
    price: (0, mysql_core_1.int)("price").notNull(),
    priceNegotiable: (0, mysql_core_1.boolean)("price_negotiable").default(false),
    brokerage: (0, mysql_core_1.text)("brokerage"),
    contactDetails: (0, mysql_core_1.text)("contact_details").notNull(),
    latitude: (0, mysql_core_1.text)("latitude"),
    longitude: (0, mysql_core_1.text)("longitude"),
    isActive: (0, mysql_core_1.boolean)("is_active").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.propertyMedia = (0, mysql_core_1.mysqlTable)("property_media", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    propertyId: (0, mysql_core_1.int)("property_id").notNull().references(() => exports.properties.id, { onDelete: 'cascade' }),
    mediaType: (0, mysql_core_1.mysqlEnum)("media_type", ['image', 'video']).notNull(),
    cloudinaryId: (0, mysql_core_1.text)("cloudinary_id").notNull(),
    cloudinaryUrl: (0, mysql_core_1.text)("cloudinary_url").notNull(),
    isFeatured: (0, mysql_core_1.boolean)("is_featured").default(false),
    orderIndex: (0, mysql_core_1.int)("order_index").default(0),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
});
exports.nearbyFacilities = (0, mysql_core_1.mysqlTable)("nearby_facilities", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    propertyId: (0, mysql_core_1.int)("property_id").notNull().references(() => exports.properties.id, { onDelete: 'cascade' }),
    facilityName: (0, mysql_core_1.text)("facility_name").notNull(),
    distance: (0, mysql_core_1.text)("distance").notNull(),
    distanceValue: (0, mysql_core_1.int)("distance_value"),
    facilityType: (0, mysql_core_1.mysqlEnum)("facility_type", ['school', 'hospital', 'market', 'park', 'metro', 'bus-stop', 'bank', 'atm', 'restaurant', 'gym', 'temple', 'mall', 'gas-station', 'other']).notNull(),
    latitude: (0, mysql_core_1.text)("latitude"),
    longitude: (0, mysql_core_1.text)("longitude"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.inquiries = (0, mysql_core_1.mysqlTable)("inquiries", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    propertyId: (0, mysql_core_1.int)("property_id").references(() => exports.properties.id),
    name: (0, mysql_core_1.text)("name").notNull(),
    email: (0, mysql_core_1.text)("email").notNull(),
    phone: (0, mysql_core_1.text)("phone").notNull(),
    message: (0, mysql_core_1.text)("message").notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ['new', 'contacted', 'resolved']).default("new").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
exports.propertiesRelations = (0, drizzle_orm_1.relations)(exports.properties, ({ many }) => ({
    media: many(exports.propertyMedia),
    facilities: many(exports.nearbyFacilities),
    inquiries: many(exports.inquiries),
}));
exports.propertyMediaRelations = (0, drizzle_orm_1.relations)(exports.propertyMedia, ({ one }) => ({
    property: one(exports.properties, {
        fields: [exports.propertyMedia.propertyId],
        references: [exports.properties.id],
    }),
}));
exports.nearbyFacilitiesRelations = (0, drizzle_orm_1.relations)(exports.nearbyFacilities, ({ one }) => ({
    property: one(exports.properties, {
        fields: [exports.nearbyFacilities.propertyId],
        references: [exports.properties.id],
    }),
}));
exports.inquiriesRelations = (0, drizzle_orm_1.relations)(exports.inquiries, ({ one }) => ({
    property: one(exports.properties, {
        fields: [exports.inquiries.propertyId],
        references: [exports.properties.id],
    }),
}));
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).omit({
    id: true,
});
exports.insertPropertySchema = (0, drizzle_zod_1.createInsertSchema)(exports.properties).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertPropertyMediaSchema = (0, drizzle_zod_1.createInsertSchema)(exports.propertyMedia).omit({
    id: true,
    createdAt: true
});
exports.insertNearbyFacilitySchema = (0, drizzle_zod_1.createInsertSchema)(exports.nearbyFacilities).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertInquirySchema = (0, drizzle_zod_1.createInsertSchema)(exports.inquiries).omit({
    id: true,
    status: true,
    createdAt: true,
    updatedAt: true
});
