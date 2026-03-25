import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Seller from '../models/Seller';
import Delivery from '../models/Delivery';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const SELLER_MOBILE = '9111966732';
const DELIVERY_MOBILE = '9000000001';
const DELIVERY_EMAIL = 'indore_delivery@test.com';

async function seedDelivery() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected.');

        // 1. Find the seller
        const seller = await Seller.findOne({ mobile: SELLER_MOBILE });
        if (!seller) {
            console.error(`Seller with mobile ${SELLER_MOBILE} not found!`);
            process.exit(1);
        }

        console.log(`Found seller: ${seller.storeName} at ${seller.location?.coordinates}`);

        // 2. Check if delivery person already exists
        let delivery = await Delivery.findOne({ mobile: DELIVERY_MOBILE });
        
        const deliveryData = {
            name: 'Seeded Indore Delivery',
            mobile: DELIVERY_MOBILE,
            email: DELIVERY_EMAIL,
            password: 'password123',
            address: seller.address || 'Indore, MP',
            city: 'Indore',
            pincode: '452001',
            status: 'Active',
            isOnline: true,
            location: seller.location || {
                type: 'Point',
                coordinates: [75.8577, 22.7196] // Default Indore if seller has no location
            },
            balance: 0,
            coinBalance: 0,
            cashCollected: 0,
            pendingAdminPayout: 0,
            settings: {
                notifications: true,
                location: true,
                sound: true
            }
        };

        if (delivery) {
            console.log('Delivery person already exists. Updating...');
            await Delivery.findByIdAndUpdate(delivery._id, deliveryData);
            console.log('Updated successfully.');
        } else {
            console.log('Creating new delivery person...');
            await Delivery.create(deliveryData);
            console.log('Created successfully.');
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding delivery person:', error);
        process.exit(1);
    }
}

seedDelivery();
