import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Rate limiter for OTP requests
 * 5 requests per 15 minutes per mobile number (falls back to IP)
 */
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.body?.mobile) {
      return String(req.body.mobile);
    }
    return ipKeyGenerator(req.ip ?? '');
  },
  skip: (req) => req.method === 'OPTIONS',
});

/**
 * Rate limiter for login attempts
 * 10 attempts per 15 minutes per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
});
