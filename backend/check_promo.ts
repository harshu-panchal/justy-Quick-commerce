import mongoose from 'mongoose';
import PromoStrip from './src/models/PromoStrip';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dhakad-snazzy';

async function check() {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const promos = await PromoStrip.find({});
    console.log('Total PromoStrips:', promos.length);

    promos.forEach(p => {
        console.log(`- Slug: ${p.headerCategorySlug}, Active: ${p.isActive}, Carousel: ${p.showAsCarousel}, Images: ${p.carouselImages?.length || 0}`);
    });

    await mongoose.disconnect();
}

check().catch(console.error);
