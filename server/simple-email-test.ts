// Simple test to verify email configuration
import { getEmailConfig } from './email';

console.log('🧪 Testing email configuration...');

try {
  const config = getEmailConfig();
  console.log('✅ Email configuration loaded successfully');
  console.log('   Host:', config.host);
  console.log('   Port:', config.port);
  console.log('   Secure:', config.secure);
  console.log('   From:', config.from);
} catch (error) {
  console.error('❌ Email configuration failed:', error);
}
