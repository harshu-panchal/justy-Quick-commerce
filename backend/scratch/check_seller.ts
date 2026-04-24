import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Seller from './src/models/Seller';

dotenv.config();

async function checkSeller() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        const seller = await Seller.findOne({ storeName: /shaktiman/i });
        if (!seller) {
            console.log('Seller not found');
            process.exit(1);
        }

        console.log('Seller Details:', {
            id: seller._id,
            storeName: seller.storeName,
            status: seller.status,
            depositPaid: seller.depositPaid,
            hasAddedFirstProduct: seller.hasAddedFirstProduct,
            category: seller.category,
            referredBy: seller.referredBy,
            commissionCredited: seller.commissionCredited,
            commissionAmount: seller.commissionAmount
        });

        if (seller.referredBy) {
            const Executive = require('../src/models/Executive').default;
            const exec = await Executive.findById(seller.referredBy);
            console.log('Executive Details:', {
                id: exec?._id,
                name: exec?.name,
                walletBalance: exec?.walletBalance,
                referralCode: exec?.referralCode
            });
        }

        const CategoryCommission = require('../src/models/CategoryCommission').default;
        const commissions = await CategoryCommission.find();
        console.log('All Category Commissions:', commissions.map((c: any) => ({ name: c.categoryName, amount: c.amount })));

        const matchingComm = await CategoryCommission.findOne({ 
            categoryName: { $regex: new RegExp(`^${seller.category}$`, 'i') } 
        });
        console.log('Matching Commission for category "' + seller.category + '":', matchingComm ? matchingComm.amount : 'None (will use default 100)');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSeller();
