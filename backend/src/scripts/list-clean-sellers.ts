import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Seller from '../models/Seller';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function listAllSellers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const sellers = await Seller.find({}, { mobile: 1, storeName: 1 });
        console.log('--- START SELLERS ---');
        sellers.forEach(s => {
            console.log(`MOBILE: [${s.mobile}] STORE: [${s.storeName}] ID: [${s._id}]`);
        });
        console.log('--- END SELLERS ---');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listAllSellers();
