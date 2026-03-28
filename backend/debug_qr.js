const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

// Load models since qrService uses them
require('./dist/models/Order');
require('./dist/models/Product');
require('./dist/models/Seller');
require('./dist/models/OrderItem');

const { generateAndAttachQr } = require('./dist/services/qrService');

async function debugQR() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/justy';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const orderId = '69c77dcb0138fc4cbe0db8ff';
    
    console.log('Generating QR for order:', orderId);
    await generateAndAttachQr(orderId, 'ORDER');
    console.log('QR generation successful!');

    const Order = mongoose.connection.collection('orders');
    const order = await Order.findOne({ _id: new mongoose.Types.ObjectId(orderId) });
    console.log('QR URL:', order.qrCodeUrl);

  } catch (err) {
    console.error('\n--- QR ERROR ---');
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

debugQR();
