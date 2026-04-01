import axios from 'axios';

async function testAdsApi() {
  try {
    const res = await axios.get('https://googleads.googleapis.com/v17/customers:listAccessibleCustomers', {
      headers: {
        'developer-token': 'dummy'
      }
    });
    console.log('Success:', res.status);
  } catch (err: any) {
    console.log('Error status:', err.response?.status);
    console.log('Error data:', err.response?.data);
    console.log('Error message:', err.message);
  }

  try {
    const res = await axios.get('https://googleads.googleapis.com/v18/customers:listAccessibleCustomers', {
      headers: {
        'developer-token': 'dummy'
      }
    });
    console.log('v18 Success:', res.status);
  } catch (err: any) {
    console.log('v18 Error status:', err.response?.status);
    console.log('v18 Error data:', err.response?.data);
  }
}

testAdsApi();
