async function testInquiry() {
  try {
    console.log('🧪 Testing inquiry submission...');
    
    const inquiryData = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+91 9999999999',
      subject: 'Test Inquiry',
      message: 'This is a test inquiry to verify email functionality.'
    };
    
    const response = await fetch('https://southdelhirealty.com/api/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inquiryData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Inquiry submission successful!');
      console.log('Response:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Inquiry submission failed:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing inquiry:', error);
  }
}

testInquiry();
