import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import { uploadImageFromBuffer } from '../services/cloudinaryService';
import { CLOUDINARY_FOLDERS } from '../config/cloudinary';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface QRPayload {
  orderId: string;
  sellerId: string;
  userId: string;
  deliveryType: 'USER' | 'SUPPLY';
  address: string;
  timestamp: number;
  orderType: 'ORDER' | 'EQUIPMENT';
}

/**
 * Sign QR payload with JWT
 */
export function signQRPayload(payload: QRPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verify and decode QR JWT token
 */
export function verifyQRToken(token: string): QRPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as QRPayload;
  } catch (error) {
    console.error('QR Token verification failed:', error);
    return null;
  }
}

/**
 * Generate QR code image as Buffer from signed token
 */
export async function generateQRBuffer(token: string): Promise<Buffer> {
  try {
    const qrDataUrl = await QRCode.toBuffer(token, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      width: 600
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Failed to generate QR buffer:', error);
    throw new Error('QR generation failed');
  }
}

/**
 * Generate, Sign and Upload QR to Cloudinary
 */
export async function createAndUploadQR(payload: QRPayload): Promise<{ url: string; token: string }> {
  const token = signQRPayload(payload);
  const buffer = await generateQRBuffer(token);
  
  const uploadResult = await uploadImageFromBuffer(buffer, {
    folder: CLOUDINARY_FOLDERS.LOGISTICS,
    overwrite: true,
    invalidate: true
  });

  return {
    url: uploadResult.secureUrl,
    token
  };
}
