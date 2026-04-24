import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ExecutiveWalletTransaction from './src/models/ExecutiveWalletTransaction';

dotenv.config();

async function checkTransactions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const latest = await ExecutiveWalletTransaction.find().sort({ createdAt: -1 }).limit(5);
        console.log('Latest Transactions:', JSON.stringify(latest, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkTransactions();
