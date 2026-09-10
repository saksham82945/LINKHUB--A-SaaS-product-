const axios = require('axios');

async function testPhase9() {
  console.log('--- Testing Phase 9: Smart Links & Creator Tools ---');

  // 1. Login
  const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
    email: 'test@linkport.io',
    password: 'Test@1234',
  });

  const token = loginRes.data.accessToken;
  console.log('✅ 1. Logged in successfully. Token acquired.');

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // 2. Test Profile QR Code
  const qrRes = await axios.get('http://localhost:5000/api/links/profile/qr', authHeaders);
  console.log('✅ 2. Profile QR Code generated:', qrRes.data.url, 'QR length:', qrRes.data.qrCode.length);

  // 3. Create a Product Card link
  const productRes = await axios.post('http://localhost:5000/api/links', {
    title: 'The SaaS Blueprint (eBook)',
    url: 'https://example.com/saas-blueprint',
    type: 'PRODUCT',
    productPrice: 39,
  }, authHeaders);
  console.log('✅ 3. Product link created:', productRes.data.id, productRes.data.title, '$' + productRes.data.productPrice);

  // 4. Create a YouTube Embed link
  const ytRes = await axios.post('http://localhost:5000/api/links', {
    title: 'Full-Stack SaaS Architecture Demo',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: 'YOUTUBE',
  }, authHeaders);
  console.log('✅ 4. YouTube embed link created:', ytRes.data.id, ytRes.data.title);

  // 5. Check Link Health
  const healthRes = await axios.post(`http://localhost:5000/api/links/${productRes.data.id}/health`, {}, authHeaders);
  console.log('✅ 5. Health check on product link:', healthRes.data.status, `(${healthRes.data.responseTimeMs}ms)`);

  // 6. Test Public Profile Fetch
  const publicRes = await axios.get('http://localhost:5000/api/profile/testuser');
  console.log('✅ 6. Public profile links retrieved:', publicRes.data.links.length);
  publicRes.data.links.forEach(l => {
    console.log(`   - [${l.type}] ${l.title} (${l.url})`);
  });

  // 7. Test Public Profile QR
  const pubQrRes = await axios.get('http://localhost:5000/api/profile/testuser/qr');
  console.log('✅ 7. Public profile QR endpoint active for @' + pubQrRes.data.username);

  console.log('\n🎉 ALL PHASE 9 BACKEND & INTEGRATION TESTS PASSED!');
}

testPhase9().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
