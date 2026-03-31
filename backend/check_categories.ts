import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import HeaderCategory from './src/models/HeaderCategory';
import Category from './src/models/Category';
import HomeSection from './src/models/HomeSection';

async function check() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found in .env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');

        const headerCategorySlug = "food";
        const headerCategory = await HeaderCategory.findOne({ slug: headerCategorySlug });
        console.log('Header Category Slug:', headerCategorySlug);
        console.log('Header Category Name:', headerCategory?.name, 'ID:', headerCategory?._id?.toString());

        if (headerCategory) {
            const sections = await HomeSection.find({ targetHeaderCategory: headerCategory._id, isActive: true }).populate('categories');
            console.log('Active Sections on Header Page:', sections.length);
            sections.forEach(s => {
                console.log('--- Section:', s.title, '(Type:', s.displayType, ')');
                console.log('   Categories in section config:', s.categories.map((c: any) => c.name));
            });

            const allCategoriesInHeader = await Category.find({ headerCategoryId: headerCategory._id, status: "Active" });
            console.log('All "Active" categories explicitly linked to this header:', allCategoriesInHeader.map(c => c.name));
            
            const junkFood = await Category.findOne({ name: /junk/i });
            console.log('Junk Food category found:', junkFood ? 'Yes' : 'No');
            if (junkFood) {
                console.log('Junk Food details:', JSON.stringify(junkFood, null, 2));
            }
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
