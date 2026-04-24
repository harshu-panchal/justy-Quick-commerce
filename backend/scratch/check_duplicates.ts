import mongoose from 'mongoose';
import Executive from '../src/models/Executive';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI || '');
    const dups = await Executive.aggregate([
        { $group: { _id: '$mobile', count: { $sum: 1 }, docs: { $push: '$_id' } } },
        { $match: { count: { $gt: 1 } } }
    ]);
    console.log('Duplicate mobiles:', JSON.stringify(dups, null, 2));
    
    const emails = await Executive.aggregate([
        { $group: { _id: '$email', count: { $sum: 1 }, docs: { $push: '$_id' } } },
        { $match: { count: { $gt: 1 } } }
    ]);
    console.log('Duplicate emails:', JSON.stringify(emails, null, 2));

    process.exit(0);
}

check();
