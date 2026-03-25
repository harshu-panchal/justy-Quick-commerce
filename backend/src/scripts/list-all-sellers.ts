import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Seller from '../models/Seller';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function listAllSellers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const sellers = await Seller.find({}, { mobile: 1, storeName: 1, location: 1 });
        console.log('All Sellers:', JSON.stringify(sellers, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listAllSellers();
