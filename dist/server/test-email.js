"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const email_1 = require("./email");
const testEmails = async () => {
    console.log('🧪 Testing email configuration...');
    const configTest = await (0, email_1.testEmailConfiguration)();
    console.log('Configuration test:', configTest);
    if (configTest.success) {
        console.log('✅ Email configuration is valid');
        console.log('🧪 Sending test email...');
        const testResult = await (0, email_1.sendTestEmail)();
        console.log('Test email result:', testResult);
        if (testResult.success) {
            console.log('✅ Test email sent successfully');
        }
        else {
            console.error('❌ Test email failed:', testResult.message);
        }
    }
    else {
        console.error('❌ Email configuration failed:', configTest.message);
    }
};
testEmails().catch(console.error);
