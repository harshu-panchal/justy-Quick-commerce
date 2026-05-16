
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import AppSettings from '../src/models/AppSettings';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkRazorpaySettings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    const settings = await AppSettings.findOne();
    console.log('Razorpay Settings in DB:');
    console.log(JSON.stringify(settings?.paymentGateways?.razorpay, null, 2));
    
    console.log('\nRazorpay Keys in ENV:');
    console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
    console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'PRESENT' : 'MISSING');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

checkRazorpaySettings();
