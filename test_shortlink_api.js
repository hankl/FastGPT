const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testShortLinkAPI() {
  try {
    console.log('Testing Short Link API...\n');

    // 测试数据
    const testData = {
      data: {
        title: 'Test Document',
        content: 'This is a test document content',
        author: 'Test User',
        timestamp: new Date().toISOString(),
        metadata: {
          version: '1.0',
          tags: ['test', 'api', 'shortlink']
        }
      },
      expireSeconds: 3600 // 1小时过期
    };

    // 1. 测试创建短链接
    console.log('1. Creating short link...');
    console.log('Request data:', JSON.stringify(testData, null, 2));
    
    const createResponse = await axios.post(`${BASE_URL}/api/common/shortLink`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Create Response Status:', createResponse.status);
    console.log('Create Response Data:', JSON.stringify(createResponse.data, null, 2));

    if (createResponse.data.code === 200 && createResponse.data.data.id) {
      const shortLinkId = createResponse.data.data.id;
      console.log(`\nShort link created successfully with ID: ${shortLinkId}\n`);

      // 2. 测试获取短链接数据
      console.log('2. Retrieving short link data...');
      
      const getResponse = await axios.get(`${BASE_URL}/api/common/shortLink/${shortLinkId}`);
      
      console.log('Get Response Status:', getResponse.status);
      console.log('Get Response Data:', JSON.stringify(getResponse.data, null, 2));

      // 3. 验证数据一致性
      if (getResponse.data.code === 200) {
        const retrievedData = getResponse.data.data.data;
        const originalData = testData.data;
        
        console.log('\n3. Verifying data consistency...');
        const isDataConsistent = JSON.stringify(retrievedData) === JSON.stringify(originalData);
        console.log('Data consistency check:', isDataConsistent ? 'PASSED' : 'FAILED');
        
        if (!isDataConsistent) {
          console.log('Original data:', JSON.stringify(originalData, null, 2));
          console.log('Retrieved data:', JSON.stringify(retrievedData, null, 2));
        }
      }
    }

    // 4. 测试错误情况
    console.log('\n4. Testing error cases...');
    
    // 测试无效数据
    try {
      await axios.post(`${BASE_URL}/api/common/shortLink`, { data: null });
    } catch (error) {
      console.log('Invalid data test - Status:', error.response?.status);
      console.log('Invalid data test - Response:', error.response?.data);
    }

    // 测试不存在的短链接
    try {
      await axios.get(`${BASE_URL}/api/common/shortLink/nonexistent`);
    } catch (error) {
      console.log('Non-existent link test - Status:', error.response?.status);
      console.log('Non-existent link test - Response:', error.response?.data);
    }

    // 测试错误的HTTP方法
    try {
      await axios.get(`${BASE_URL}/api/common/shortLink`);
    } catch (error) {
      console.log('Wrong method test - Status:', error.response?.status);
      console.log('Wrong method test - Response:', error.response?.data);
    }

    console.log('\nAPI testing completed!');

  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// 运行测试
testShortLinkAPI();