
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Seller from '../src/models/Seller';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkSeller() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    const seller = await Seller.findById('69f9e1a8dcc8cca913456f66');
    console.log('Seller Details:');
    console.log(JSON.stringify(seller, null, 2));

    await mongoose.connection.close();
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

checkSeller();
