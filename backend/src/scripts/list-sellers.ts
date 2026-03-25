import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Seller from '../models/Seller';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function listSellers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const sellers = await Seller.find().sort({ createdAt: -1 }).limit(10);
        console.log('Recent sellers:', JSON.stringify(sellers.map(s => ({ mobile: s.mobile, storeName: s.storeName, location: s.location })), null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listSellers();
