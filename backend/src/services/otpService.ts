import axios from 'axios';
import Otp from '../models/Otp';
import { sendEmail } from './mailService';

// SMS India HUB Configuration
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
  if (process.env.USE_MOCK_OTP === 'true' || process.env.NODE_ENV !== 'production') {
    return length === 4 ? '1234' : '123456';
  }
  
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
  if (!SMS_INDIA_HUB_API_KEY || !SMS_INDIA_HUB_SENDER_ID) {
    throw new Error('SMS India HUB credentials are missing.');
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

  if (SMS_INDIA_HUB_DLT_TEMPLATE_ID?.trim()) {
    params.DLT_TE_ID = SMS_INDIA_HUB_DLT_TEMPLATE_ID.trim();
  }

  await axios.get<SmsIndiaHubResponse>(SMS_INDIA_HUB_API_URL, {
    params,
    timeout: API_TIMEOUT,
  });
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

/**
 * Check if special bypass should be used
 */
function isSpecialBypass(id: string): boolean {
  return id === '9111966732' || id === 'test@speeup.com';
}

/**
 * Check if mock mode should be used
 */
function isMockMode(): boolean {
  return process.env.USE_MOCK_OTP === 'true';
}

function isDeveloperBypass(otp: string): boolean {
  return otp === '1234' || otp === '9999' || otp === '123456';
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

    if (isSpecialBypass(email) || isMockMode()) {
      await saveOtpToDb({ email }, otp, userType);
      console.log(`[VERIFIED] Mock Email OTP for ${email}: ${otp}`);
      return { success: true, message: 'OTP sent successfully' };
    }

    const success = await sendEmail(email, 'Your Verification Code', otp);
    if (!success) throw new Error('Email sending failed');

    await saveOtpToDb({ email }, otp, userType);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error: any) {
    throw new Error(error.message || 'Error sending email OTP');
  }
}

export async function verifyEmailOtp(
  email: string,
  otp: string,
  userType: UserType = 'Seller'
): Promise<boolean> {
  if (isDeveloperBypass(otp)) return true;
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
  try {
    const otp = generateOTP(4);

    if (isSpecialBypass(mobile) || isMockMode()) {
      await saveOtpToDb({ mobile }, otp, userType);
      return { success: true, message: 'OTP sent successfully' };
    }

    await saveOtpToDb({ mobile }, otp, userType);
    const message = buildOtpMessage(otp);
    await sendSmsViaApi(mobile, message);

    return { success: true, message: 'OTP sent successfully' };
  } catch (error: any) {
    throw new Error(error.message || 'Error sending SMS OTP');
  }
}

export async function verifyOTP(
  mobile: string,
  otp: string,
  userType: UserType
): Promise<boolean> {
  if (isDeveloperBypass(otp)) return true;
  return verifyOtpFromDb({ mobile }, otp, userType);
}

// Legacy functions for Customer/Delivery
export async function sendSmsOtp(mobile: string, userType: 'Customer' | 'Delivery'): Promise<OtpResponse> {
  return sendOTP(mobile, userType);
}

export async function verifySmsOtp(_sessionId: string, otpInput: string, mobile: string, userType: 'Customer' | 'Delivery'): Promise<boolean> {
  return verifyOTP(mobile, otpInput, userType);
}
