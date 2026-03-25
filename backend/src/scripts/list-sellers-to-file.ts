import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Seller from '../models/Seller';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function listAllSellers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const sellers = await Seller.find({}, { mobile: 1, storeName: 1 });
        let output = '--- SELLERS LIST ---\n';
        sellers.forEach(s => {
            output += `MOBILE: [${s.mobile}] STORE: [${s.storeName}] ID: [${s._id}]\n`;
        });
        fs.writeFileSync(path.join(__dirname, '../../sellers_list.txt'), output);
        console.log('Sellers written to sellers_list.txt');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listAllSellers();
