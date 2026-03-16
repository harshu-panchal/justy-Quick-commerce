import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Return from '../models/Return';
import OrderItem from '../models/OrderItem';

dotenv.config();

async function testApprove() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');
  
  const latestReturn = await Return.findOne().sort({ createdAt: -1 });
  if (!latestReturn) {
    console.log('No return found');
    process.exit(0);
  }
  console.log('Found Return Request for OrderItem:', latestReturn.orderItem);
  console.log('Current Status:', latestReturn.status, '| Reason:', latestReturn.reason);

  latestReturn.status = 'Approved';
  await latestReturn.save();

  await OrderItem.findByIdAndUpdate(latestReturn.orderItem, { status: 'Returned' });
  console.log('Successfully Approved the Return!');
  process.exit(0);
}
testApprove().catch(console.error);