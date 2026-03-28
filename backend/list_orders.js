const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function listOrders() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/justy';
    await mongoose.connect(MONGODB_URI);
    
    const Order = mongoose.connection.collection('orders');
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(5).toArray();
    
    console.log('\n--- Recent Orders ---');
    orders.forEach(o => {
      console.log(`ID: ${o._id}, OrderNumber: ${o.orderNumber}, Status: ${o.status}, QR: ${o.qrCodeUrl ? 'YES' : 'NO'}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

listOrders();
