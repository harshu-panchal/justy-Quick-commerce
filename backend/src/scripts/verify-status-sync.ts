import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import Seller from '../models/Seller';
import Commission from '../models/Commission';
import { processOrderStatusTransition } from '../services/orderService';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function verifyStatusSync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to MongoDB');

    // 1. Find a recent order that is NOT delivered
    const order = await Order.findOne({ status: { $ne: 'Delivered' } }).sort({ createdAt: -1 });
    if (!order) {
      console.log('No eligible order found to test status sync.');
      return;
    }

    const orderId = order._id.toString();
    const previousStatus = order.status;
    console.log(`Testing Order: ${orderId} (Current Status: ${previousStatus})`);

    // 2. Perform the transition to Delivered
    console.log('Transitioning to Delivered...');
    order.status = 'Delivered';
    await order.save();
    
    // Call the centralized transition logic (which our controllers now call)
    await processOrderStatusTransition(orderId, 'Delivered', previousStatus);

    // 3. Verify Order status
    const updatedOrder = await Order.findById(orderId);
    console.log(`Updated Order Status: ${updatedOrder?.status}`);
    console.log(`Updated DeliveryBoy Status: ${updatedOrder?.deliveryBoyStatus}`);
    
    if (updatedOrder?.status === 'Delivered' && updatedOrder?.deliveryBoyStatus === 'Delivered') {
      console.log('✅ Order and DeliveryBoy status are SYNCED');
    } else {
      console.log('❌ Order and DeliveryBoy status are NOT SYNCED');
    }

    // 4. Verify OrderItem status
    const items = await OrderItem.find({ order: orderId });
    const allItemsDelivered = items.every(item => item.status === 'Delivered');
    console.log(`Order Items Status Sync: ${allItemsDelivered ? '✅ ALL DELIVERED' : '❌ NOT ALL DELIVERED'}`);
    items.forEach(item => console.log(`  - Item ${item._id.toString().slice(-4)}: ${item.status}`));

    // 5. Note on Seller Balance
    const commissionExist = await Commission.findOne({ order: orderId });
    console.log(`Commission Records Created: ${commissionExist ? '✅ YES' : '❌ NO'}`);

  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

verifyStatusSync();
