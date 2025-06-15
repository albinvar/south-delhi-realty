"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSuperAdmin = initializeSuperAdmin;
const auth_1 = require("./auth");
const storage_1 = require("./storage");
async function initializeSuperAdmin() {
    try {
        console.log('🚀 Initializing superadmin user...');
        const users = await storage_1.storage.getUsers();
        const existingSuperAdmins = users.filter(user => user.role === 'superadmin');
        if (existingSuperAdmins.length > 0) {
            console.log(`✅ Found ${existingSuperAdmins.length} existing superadmin user(s). Skipping initialization.`);
            return;
        }
        console.log('📝 No superadmin users found. Creating default superadmin...');
        try {
            await storage_1.storage.findUserByUsername('superadmin');
            console.log('⚠️ Username "superadmin" already exists but with different role. Skipping creation.');
            return;
        }
        catch (error) {
        }
        const hashedPassword = await (0, auth_1.hashPassword)('superadmin123');
        await storage_1.storage.createUser({
            username: 'superadmin',
            email: 'superadmin@southdelhirealty.com',
            password: hashedPassword,
            role: 'superadmin'
        });
        console.log('✅ Default superadmin user created successfully!');
        console.log('📋 Credentials:');
        console.log('   Username: superadmin');
        console.log('   Password: superadmin123');
        console.log('   Email: superadmin@southdelhirealty.com');
        console.log('   Role: superadmin');
        console.log('⚠️  Please change the password after first login!');
    }
    catch (error) {
        console.error(`❌ Error initializing superadmin: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}
