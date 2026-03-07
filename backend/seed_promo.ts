import mongoose from 'mongoose';
import PromoStrip from './src/models/PromoStrip';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || '';

async function seed() {
    await mongoose.connect(mongoUri);
    console.log('Connected to:', mongoose.connection.name);

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const endDate = new Date();
    endDate.setFullYear(now.getFullYear() + 1);

    const slugs = ['all', 'dark']; // Seed for home and Fast food

    for (const slug of slugs) {
        const defaultPromo = {
            headerCategorySlug: slug,
            heading: slug === 'all' ? 'HOUSEFULL SALE' : 'FAST FOOD DEALS',
            saleText: 'SALE',
            startDate: yesterday,
            endDate: endDate,
            showAsCarousel: true,
            carouselImages: [
                {
                    imageUrl: 'https://img.freepik.com/free-vector/grocery-store-sale-banner-template_23-2150032212.jpg',
                    link: '/category/grocery',
                    order: 1
                },
                {
                    imageUrl: 'https://img.freepik.com/free-vector/supermarket-sale-banner-template_23-2149363385.jpg',
                    link: '/category/snacks',
                    order: 2
                },
                {
                    imageUrl: 'https://img.freepik.com/free-vector/flat-grocery-store-sale-banner-template_23-2150032213.jpg',
                    link: '/category/vegetables',
                    order: 3
                }
            ],
            isActive: true,
            order: 1
        };

        await PromoStrip.findOneAndUpdate(
            { headerCategorySlug: slug },
            defaultPromo,
            { upsert: true, new: true }
        );
        console.log(`PromoStrip for "${slug}" seeded successfully!`);
    }

    await mongoose.disconnect();
}

seed().catch(console.error);
