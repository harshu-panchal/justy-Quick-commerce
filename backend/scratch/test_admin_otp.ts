
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { sendOTP } from '../src/services/otpService';
import Otp from '../src/models/Otp';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testAdminOtp() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    const testMobile = '9876543210';
    const userType = 'Admin';

    console.log(`Sending OTP for ${userType} to ${testMobile}...`);
    const result = await sendOTP(testMobile, userType);
    console.log('Result:', result);

    const savedOtp = await Otp.findOne({ mobile: testMobile, userType });
    console.log('Saved OTP in DB:', savedOtp?.otp);

    if (savedOtp?.otp === (process.env.ADMIN_OTP || '1234')) {
      console.log('SUCCESS: Admin OTP is the default value.');
    } else {
      console.log('FAILURE: Admin OTP is NOT the default value.');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testAdminOtp();
