import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Seller from '../models/Seller';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function findSeller() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const sellers = await Seller.find({ mobile: /911966732/ });
        console.log('Matching sellers:', JSON.stringify(sellers.map(s => ({ mobile: s.mobile, storeName: s.storeName, location: s.location })), null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

findSeller();
