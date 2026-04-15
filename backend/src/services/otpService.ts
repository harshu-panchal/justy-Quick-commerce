import axios from 'axios';
import Otp from '../models/Otp';
import { sendEmail } from './mailService';

// SMS India HUB Configuration
const SMS_INDIA_HUB_USERNAME = process.env.SMS_INDIA_HUB_USERNAME;
const SMS_INDIA_HUB_API_KEY = process.env.SMS_INDIA_HUB_API_KEY;
const SMS_INDIA_HUB_SENDER_ID = process.env.SMS_INDIA_HUB_SENDER_ID;
const SMS_INDIA_HUB_DLT_TEMPLATE_ID = process.env.SMS_INDIA_HUB_DLT_TEMPLATE_ID;
const SMS_INDIA_HUB_API_URL = 'http://cloud.smsindiahub.in/vendorsms/pushsms.aspx';
const API_TIMEOUT = 30000; // 30 seconds

/**
 * Interface for OTP Response
 */
interface OtpResponse {
  success: boolean;
  sessionId?: string;
  message: string;
}

/**
 * SMS India HUB API Response Interface
 */
interface SmsIndiaHubResponse {
  ErrorCode?: string;
  ErrorMessage?: string;
  JobId?: string;
  MessageId?: string;
  MessageData?: Array<{
    Number: string;
    MessageId: string;
    Message: string;
  }>;
}

type UserType = 'Customer' | 'Delivery' | 'Seller' | 'Admin';

/**
 * Generate numeric OTP
 */
function generateOTP(length: number = 4): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

/**
 * Normalize mobile number to include country code (91)
 */
function normalizeMobileNumber(mobile: string): string {
  let cleanMobile = mobile.replace(/^\+/, '').replace(/\D/g, '');

  if (!cleanMobile.startsWith('91')) {
    cleanMobile = '91' + cleanMobile;
  }

  if (cleanMobile.length < 12 || cleanMobile.length > 13) {
    throw new Error(`Invalid mobile number: ${cleanMobile}. Must be 12-13 digits with country code.`);
  }

  return cleanMobile;
}

/**
 * Build DLT-compliant message
 */
function buildOtpMessage(otp: string): string {
  const appName = process.env.APP_NAME || 'dhakadsnazzy';
  return `Welcome to the ${appName} powered by SMSINDIAHUB. Your OTP for registration is ${otp}`;
}

/**
 * Send SMS via SMS India HUB API
 */
async function sendSmsViaApi(mobile: string, message: string): Promise<void> {
  if (!SMS_INDIA_HUB_API_KEY || !SMS_INDIA_HUB_SENDER_ID || process.env.USE_MOCK_OTP === 'true') {
    console.log(`[TEST-MODE] SMS to ${mobile} skipped. Content: ${message}`);
    return;
  }

  const cleanMobile = normalizeMobileNumber(mobile);

  const params: Record<string, string> = {
    APIKey: SMS_INDIA_HUB_API_KEY.trim(),
    msisdn: cleanMobile,
    sid: SMS_INDIA_HUB_SENDER_ID.trim(),
    msg: message,
    fl: '0',
    gwid: '2',
  };

  // Add Username if provided
  if (SMS_INDIA_HUB_USERNAME?.trim()) {
    params.user = SMS_INDIA_HUB_USERNAME.trim();
  }

  if (SMS_INDIA_HUB_DLT_TEMPLATE_ID?.trim()) {
    params.DLT_TE_ID = SMS_INDIA_HUB_DLT_TEMPLATE_ID.trim();
  }

  try {
    await axios.get<SmsIndiaHubResponse>(SMS_INDIA_HUB_API_URL, {
      params,
      timeout: API_TIMEOUT,
    });
  } catch (err) {
    console.error('SMS Send Error:', err);
    // Continue anyway for testing
  }
}

/**
 * Save OTP to database
 */
async function saveOtpToDb(identifier: { mobile?: string; email?: string }, otp: string, userType: UserType): Promise<void> {
  const query = identifier.mobile 
    ? { mobile: identifier.mobile.replace(/\D/g, ''), userType } 
    : { email: identifier.email?.toLowerCase(), userType };
  
  await Otp.deleteMany(query);
  await Otp.create({
    ...query,
    otp: otp.trim(),
    userType,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
  });
}

/**
 * Verify OTP from database
 */
async function verifyOtpFromDb(identifier: { mobile?: string; email?: string }, otp: string, userType: UserType): Promise<boolean> {
  // Allow Developer/Static Bypass
  const query = identifier.mobile 
    ? { mobile: identifier.mobile.replace(/\D/g, ''), userType } 
    : { email: identifier.email?.toLowerCase(), userType };

  const record = await Otp.findOne({
    ...query,
    otp: otp.trim()
  });

  if (!record) return false;

  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id });
    return false;
  }

  await Otp.deleteOne({ _id: record._id });
  return true;
}

// ==========================================
// EMAIL OTP
// ==========================================

export async function sendEmailOtp(
  email: string,
  userType: UserType = 'Seller'
): Promise<OtpResponse> {
  try {
    const otp = generateOTP(6);
    
    // For local testing, we might not have mail setup either
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials missing. Static OTP is: 123456');
    } else {
      await sendEmail(email, 'Your Verification Code', otp);
    }

    await saveOtpToDb({ email }, otp, userType);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error: any) {
    console.error('Email OTP Error:', error);
    // Still return success for testing
    await saveOtpToDb({ email }, '123456', userType);
    return { success: true, message: 'OTP sent successfully (Mock)' };
  }
}

export async function verifyEmailOtp(
  email: string,
  otp: string,
  userType: UserType = 'Seller'
): Promise<boolean> {
  return verifyOtpFromDb({ email }, otp, userType);
}

// ==========================================
// SMS OTP
// ==========================================

export async function sendOTP(
  mobile: string,
  userType: UserType,
  _isLogin: boolean = true
): Promise<OtpResponse> {
  console.log(`[OTP] Sending OTP request for mobile: ${mobile}, userType: ${userType}`);
  
  try {
    let otp: string;
    
    // For Admin, use static OTP 1234
    if (String(userType).toLowerCase() === 'admin') {
      otp = '1234';
      console.log(`[OTP] Using static Admin OTP for ${mobile}`);
    } else {
      otp = generateOTP(4);
      console.log(`[OTP] Generated dynamic OTP: ${otp} for ${mobile} (${userType})`);
    }

    await saveOtpToDb({ mobile }, otp, userType);

    // Only send SMS for non-Admin users or if it's dynamic
    if (String(userType).toLowerCase() !== 'admin') {
      const message = buildOtpMessage(otp);
      console.log(`[OTP] Sending SMS to ${mobile} via API...`);
      await sendSmsViaApi(mobile, message);
    }

    return { 
      success: true, 
      message: 'OTP sent successfully',
      sessionId: `SESSION_${mobile}_${Date.now()}` 
    };
  } catch (error: any) {
    console.error('SMS OTP Error:', error);
    // Return success for testing/failing gracefully
    return { 
      success: true, 
      message: 'OTP sent successfully (Mock)',
      sessionId: `MOCK_${mobile}_${Date.now()}`
    };
  }
}

export async function verifyOTP(
  mobile: string,
  otp: string,
  userType: UserType
): Promise<boolean> {
  console.log(`[OTP] Verifying OTP: ${otp} for mobile: ${mobile}, userType: ${userType}`);
  return verifyOtpFromDb({ mobile }, otp, userType);
}

// Legacy functions for Customer/Delivery
export async function sendSmsOtp(mobile: string, userType: 'Customer' | 'Delivery'): Promise<OtpResponse> {
  return sendOTP(mobile, userType);
}

export async function verifySmsOtp(_sessionId: string, otpInput: string, mobile: string, userType: 'Customer' | 'Delivery'): Promise<boolean> {
  return verifyOTP(mobile, otpInput, userType);
}
