#!/usr/bin/env node

// Session Store Test Script
// This script tests if the session store is working correctly

const session = require('express-session');
const memorystore = require('memorystore');

console.log('🔧 Session Store Test Script');
console.log('============================');

// Create memory store constructor
const MemoryStore = memorystore(session);

// Configure session store with same settings as application
const sessionStore = new MemoryStore({
  checkPeriod: 86400000, // Prune expired entries every 24h
  max: 1000, // Maximum number of sessions to store
  ttl: 86400000, // Time to live - 24 hours
  stale: false, // Don't return stale data
  dispose: (key, value) => {
    console.log(`Session expired: ${key}`);
  },
  noDisposeOnSet: true
});

console.log('✅ Session store created successfully');

// Test session store operations
async function testSessionStore() {
  console.log('\n🔍 Testing session store operations...');
  
  // Test 1: Store a session
  const testSessionId = 'test-session-123';
  const testSessionData = {
    passport: {
      user: 8
    },
    cookie: {
      originalMaxAge: 86400000,
      expires: new Date(Date.now() + 86400000),
      httpOnly: true,
      path: '/'
    }
  };
  
  console.log('📝 Storing test session...');
  await new Promise((resolve, reject) => {
    sessionStore.set(testSessionId, testSessionData, (err) => {
      if (err) {
        console.error('❌ Failed to store session:', err);
        reject(err);
      } else {
        console.log('✅ Session stored successfully');
        resolve();
      }
    });
  });
  
  // Test 2: Retrieve the session
  console.log('📖 Retrieving test session...');
  await new Promise((resolve, reject) => {
    sessionStore.get(testSessionId, (err, session) => {
      if (err) {
        console.error('❌ Failed to retrieve session:', err);
        reject(err);
      } else if (!session) {
        console.error('❌ Session not found');
        reject(new Error('Session not found'));
      } else {
        console.log('✅ Session retrieved successfully:', session);
        resolve();
      }
    });
  });
  
  // Test 3: List all sessions
  console.log('📋 Listing all sessions...');
  await new Promise((resolve, reject) => {
    sessionStore.all((err, sessions) => {
      if (err) {
        console.error('❌ Failed to list sessions:', err);
        reject(err);
      } else {
        console.log(`✅ Found ${Object.keys(sessions).length} sessions`);
        console.log('Session IDs:', Object.keys(sessions));
        resolve();
      }
    });
  });
  
  // Test 4: Delete the session
  console.log('🗑️  Deleting test session...');
  await new Promise((resolve, reject) => {
    sessionStore.destroy(testSessionId, (err) => {
      if (err) {
        console.error('❌ Failed to delete session:', err);
        reject(err);
      } else {
        console.log('✅ Session deleted successfully');
        resolve();
      }
    });
  });
  
  // Test 5: Verify session is deleted
  console.log('✅ Verifying session deletion...');
  await new Promise((resolve, reject) => {
    sessionStore.get(testSessionId, (err, session) => {
      if (err) {
        console.error('❌ Error checking deleted session:', err);
        reject(err);
      } else if (session) {
        console.error('❌ Session still exists after deletion');
        reject(new Error('Session still exists'));
      } else {
        console.log('✅ Session successfully deleted');
        resolve();
      }
    });
  });
  
  console.log('\n🎉 All session store tests passed!');
}

// Run the test
testSessionStore().catch((error) => {
  console.error('\n💥 Session store test failed:', error);
  process.exit(1);
});
