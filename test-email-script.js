async function testEmail() {
  try {
    console.log('🧪 Testing email functionality...');
    
    const response = await fetch('https://southdelhirealty.com/api/test-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
    
    if (response.ok) {
      console.log('✅ Email test successful!');
    } else {
      console.log('❌ Email test failed:', result);
    }
  } catch (error) {
    console.error('❌ Error testing email:', error);
  }
}

testEmail();
