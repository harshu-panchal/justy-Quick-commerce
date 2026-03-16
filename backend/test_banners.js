const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const API_URL = `http://localhost:${process.env.PORT || 5001}/api/v1`;

async function testBannerAPI() {
    try {
        console.log('--- Testing Banner API ---');

        // Note: For real testing, we would need a valid admin token.
        // Since I cannot easily get one here, I'll test the public endpoint 
        // and check if the routes are registered.

        // Test Public Get (Empty initially)
        try {
            const resQuick = await axios.get(`${API_URL}/banners/quick`);
            console.log('GET /banners/quick:', resQuick.status, 'Data length:', resQuick.data.data.length);
            
            const resScheduled = await axios.get(`${API_URL}/banners/scheduled`);
            console.log('GET /banners/scheduled:', resScheduled.status, 'Data length:', resScheduled.data.data.length);
        } catch (err) {
            console.error('Public fetch failed:', err.message);
        }

        console.log('\n--- Route Registration Verification ---');
        // I'll check if the routes exist by checking for 401 instead of 404
        try {
            await axios.get(`${API_URL}/admin/banners`);
        } catch (err) {
            if (err.response && err.response.status === 401) {
                console.log('GET /admin/banners is registered and protected (401 Unauthorized)');
            } else {
                console.log('GET /admin/banners status:', err.response ? err.response.status : err.message);
            }
        }

        try {
            await axios.post(`${API_URL}/admin/banners`, {});
        } catch (err) {
            if (err.response && err.response.status === 401) {
                console.log('POST /admin/banners is registered and protected (401 Unauthorized)');
            } else {
                console.log('POST /admin/banners status:', err.response ? err.response.status : err.message);
            }
        }

    } catch (error) {
        console.error('Test script error:', error);
    }
}

testBannerAPI();
