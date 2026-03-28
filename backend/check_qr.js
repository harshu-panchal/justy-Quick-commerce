const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkOrderStatus() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/justy';
    await mongoose.connect(MONGODB_URI);
    
    // NEW ID from user
    const orderId = '69c77dcb0138fc4cbe0db8ff';
    
    const Order = mongoose.connection.collection('orders');
    const order = await Order.findOne({ _id: new mongoose.Types.ObjectId(orderId) });
    
    if (!order) {
      console.log('Order not found');
      return;
    }

    console.log('\n--- Current Order State ---');
    console.log('Order ID:', order._id);
    console.log('Status:', order.status);
    console.log('QR Code URL:', order.qrCodeUrl || 'NULL');
    console.log('QR Data:', order.qrData || 'NULL');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkOrderStatus();
