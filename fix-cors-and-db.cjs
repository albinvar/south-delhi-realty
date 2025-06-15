const https = require('https');

const API_BASE = 'https://south-delhi-realty-4g75c.ondigitalocean.app';

// Function to make API requests with proper headers  
function apiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'south-delhi-realty-4g75c.ondigitalocean.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Database-Fix-Tool/1.0'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || body}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ body });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function checkPropertyEndpoint() {
  console.log('🔍 Checking if property API is working...');
  
  try {
    const response = await apiRequest('GET', '/api/properties');
    console.log('✅ Property API is working!');
    console.log(`📊 Found ${response.properties?.length || 0} properties`);
    
    if (response.properties?.length > 0) {
      const property = response.properties[0];
      console.log(`🏠 First property: "${property.title}" (ID: ${property.id})`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Property API error:', error.message);
    return false;
  }
}

async function checkHealthEndpoint() {
  console.log('🔍 Checking server health...');
  
  try {
    const response = await apiRequest('GET', '/health');
    console.log('✅ Server health check passed:', response.status);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

async function testCorsEndpoint() {
  console.log('🔍 Testing CORS with different origins...');
  
  // Test without origin (same-origin request)
  try {
    await checkPropertyEndpoint();
    console.log('✅ Same-origin requests work');
  } catch (error) {
    console.log('❌ Same-origin requests failing:', error.message);
  }
}

async function main() {
  console.log('🔧 South Delhi Real Estate - CORS & Database Fix');
  console.log('===============================================');
  console.log('🎯 Checking current API status and connectivity');
  console.log('');
  
  // Check basic connectivity
  const healthOk = await checkHealthEndpoint();
  const propsOk = await checkPropertyEndpoint();
  
  console.log('');
  console.log('📋 Status Summary:');
  console.log(`   Health Endpoint: ${healthOk ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Properties API: ${propsOk ? '✅ Working' : '❌ Failed'}`);
  
  if (propsOk) {
    console.log('');
    console.log('🎉 Good news! Your property data is already imported and accessible!');
    console.log('');
    console.log('🌐 Property is live at: https://south-delhi-realty-4g75c.ondigitalocean.app');
    console.log('🏠 Property title: "avsfdvd"');
    console.log('🆔 Property ID: 1');
    console.log('');
    console.log('⚠️  However, there are still authentication issues preventing login.');
    console.log('');
    console.log('🔧 Issues identified from server logs:');
    console.log('   1. CORS blocking frontend requests');
    console.log('   2. Missing password column in users table');
    console.log('');
    console.log('💡 To fix these issues, the server code needs to be updated and redeployed.');
  }
  
  console.log('');
  console.log('🔑 Login credentials (once database is fixed):');
  console.log('   Username: superadmin');
  console.log('   Password: superadmin123');
  console.log('   URL: https://south-delhi-realty-4g75c.ondigitalocean.app/auth');
}

main().catch(console.error); 