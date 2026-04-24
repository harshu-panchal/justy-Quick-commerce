import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import path from 'path';

// Point to the backend .env file
dotenv.config({ path: '/Users/ujjawalmahawar/Desktop/Appzeto/justy-Quick-commerce/backend/.env' });

const keyId = process.env.RAZORPAY_KEY_ID?.trim();
const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

console.log('Testing Razorpay with:');
console.log('Key ID:', keyId);
console.log('Key Secret:', keySecret ? '***' + keySecret.slice(-4) : 'undefined');

if (!keyId || !keySecret) {
    console.error('Credentials missing');
    process.exit(1);
}

const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
});

async function test() {
    try {
        console.log('Fetching orders...');
        const orders = await razorpay.orders.all({ count: 1 });
        console.log('SUCCESS! Orders fetched.');
    } catch (error: any) {
        console.error('FAILURE!');
        console.error('Error message:', error.message);
        console.error('Error description:', error.error?.description);
        // console.error('Full error:', JSON.stringify(error, null, 2));
    }
}

test();
