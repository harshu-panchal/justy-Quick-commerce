import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function checkDatabase() {
    try {
        console.log("Connecting to:", process.env.MONGODB_URI?.substring(0, 20) + "...");
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log("Connected.");

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        const WalletTransaction = mongoose.connection.collection('wallettransactions');
        const sample = await WalletTransaction.findOne({ userType: 'CUSTOMER' });
        console.log("Sample Customer Transaction:", sample);

        const counts = await WalletTransaction.aggregate([
            { $group: { _id: "$userType", count: { $sum: 1 } } }
        ]).toArray();
        console.log("UserType Counts:", counts);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDatabase();
