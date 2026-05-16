
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testRazorpay() {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });

    console.log('Attempting to fetch payments...');
    const payments = await razorpay.payments.all({ count: 1 });
    console.log('Success! Connection verified.');
    console.log('Payments:', JSON.stringify(payments, null, 2));
  } catch (error: any) {
    console.error('Razorpay Connection Failed:');
    console.error('Status Code:', error.statusCode);
    console.error('Error Description:', error.error?.description || error.message);
    process.exit(1);
  }
}

testRazorpay();
