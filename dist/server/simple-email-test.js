"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const email_1 = require("./email");
console.log('🧪 Testing email configuration...');
try {
    const config = (0, email_1.getEmailConfig)();
    console.log('✅ Email configuration loaded successfully');
    console.log('   Host:', config.host);
    console.log('   Port:', config.port);
    console.log('   Secure:', config.secure);
    console.log('   From:', config.from);
}
catch (error) {
    console.error('❌ Email configuration failed:', error);
}
