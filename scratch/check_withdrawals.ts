import mongoose from 'mongoose';
import ExecutiveWithdrawal from './backend/src/models/ExecutiveWithdrawal';
import Executive from './backend/src/models/Executive';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function checkWithdrawals() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/justy');
        console.log('Connected to MongoDB');

        const withdrawals = await ExecutiveWithdrawal.find().populate('executive');
        console.log(`Found ${withdrawals.length} withdrawals`);
        
        withdrawals.forEach((w, i) => {
            console.log(`[${i}] ID: ${w._id}, Status: ${w.status}, Executive: ${w.executive ? (w.executive as any).name : 'NULL'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkWithdrawals();
