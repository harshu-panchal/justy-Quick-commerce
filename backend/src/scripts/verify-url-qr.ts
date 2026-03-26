import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Order from '../models/Order';
import { generateQRUrl } from '../utils/qrUtils';
import { generateAndAttachQr } from '../services/qrService';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function verifyQR() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to MongoDB');

    // 1. Find a recent order
    const order = await Order.findOne().sort({ createdAt: -1 });
    if (!order) {
      console.log('No order found to test.');
      return;
    }

    console.log(`Found Order: ${order._id} (Number: ${order.orderNumber})`);

    // 2. Test URL generation
    const qrUrl = generateQRUrl(order._id.toString(), 'ORDER');
    console.log(`Generated QR URL: ${qrUrl}`);
    
    if (qrUrl.includes('/order/') && qrUrl.includes('type=ORDER')) {
      console.log('✅ URL Generation format is CORRECT');
    } else {
      console.log('❌ URL Generation format is INVALID');
    }

    // 3. Test QR Attachment (re-generate)
    console.log('Regenerating QR...');
    await generateAndAttachQr(order._id.toString(), 'ORDER');
    
    const updatedOrder = await Order.findById(order._id);
    console.log(`Updated Order QR Image URL: ${updatedOrder?.qrCodeUrl}`);
    
    if (updatedOrder?.qrCodeUrl) {
      console.log('✅ QR Image (Cloudinary) was generated and attached');
    }

    // Note: We can't easily test the public API Response here without starting the server, 
    // but we've verified the data structure is in place.

  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

verifyQR();
