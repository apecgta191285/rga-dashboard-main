const axios = require('axios');

async function testAdsApi() {
  try {
    const res = await axios.get('https://googleads.googleapis.com/v18/customers:listAccessibleCustomers', {
      headers: {
        'developer-token': 'dummy',
        'Authorization': 'Bearer dummy'
      }
    });
    console.log('GET Success:', res.status);
  } catch (err) {
    console.log('GET Error:', err.response?.status);
  }

  try {
    const res = await axios.post('https://googleads.googleapis.com/v18/customers:listAccessibleCustomers', {}, {
      headers: {
        'developer-token': 'dummy',
        'Authorization': 'Bearer dummy'
      }
    });
    console.log('POST Success:', res.status);
  } catch (err) {
    console.log('POST Error:', err.response?.status);
  }
}

testAdsApi();
