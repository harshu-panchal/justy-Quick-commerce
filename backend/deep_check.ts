import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || '';

async function check() {
    if (!mongoUri) {
        console.error('MONGODB_URI not found in .env');
        return;
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to:', mongoose.connection.name);

    if (!mongoose.connection.db) {
        console.error('Database connection failed to initialize');
        await mongoose.disconnect();
        return;
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    const PromoStrip = mongoose.connection.collection('promostrips');
    const count = await PromoStrip.countDocuments();
    console.log('PromoStrip count:', count);

    if (count > 0) {
        const all = await PromoStrip.find({}).toArray();
        console.log('Data:', JSON.stringify(all, null, 2));
    }

    await mongoose.disconnect();
}

check().catch(console.error);
