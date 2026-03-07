const axios = require('axios');

async function testRoute() {
    try {
        const response = await axios.post('http://localhost:5000/api/v1/payment/seller/deposit/create-order');
        console.log('Response Status:', response.status);
    } catch (error) {
        if (error.response) {
            console.log('Response Status:', error.response.status);
            console.log('Response Data:', error.response.data);
        } else {
            console.log('Error Message:', error.message);
        }
    }
}

testRoute();
