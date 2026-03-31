import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import HeaderCategory from './src/models/HeaderCategory';
import Category from './src/models/Category';
import HomeSection from './src/models/HomeSection';

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const food = await HeaderCategory.findOne({ slug: "food" });
        const junk = await Category.findOne({ name: "Junk Food" });
        const sections = await HomeSection.find({ targetHeaderCategory: food?._id, isActive: true });
        
        const results = {
            foodHeader: food,
            junkCategory: junk,
            sections: sections.map(s => ({
                title: s.title,
                displayType: s.displayType,
                categories: s.categories.map(c => c.toString())
            }))
        };
        
        fs.writeFileSync(path.join(__dirname, 'diagnostic_results.json'), JSON.stringify(results, null, 2));
        process.exit(0);
    } catch(e) { console.error(e); process.exit(1); }
}
check();
