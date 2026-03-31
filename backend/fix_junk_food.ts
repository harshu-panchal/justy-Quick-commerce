import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import HomeSection from './src/models/HomeSection';

async function update() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');

        const junkFoodId = "69cba791c20cf95df4bdf40b";
        
        // Find the "Fast Foods" section for the "Food" header category
        const section = await HomeSection.findOne({ 
            title: "Fast Foods",
            pageLocation: "Header Category Page"
        });

        if (section) {
            console.log('Found section:', section.title);
            const currentCategories = section.categories.map(c => c.toString());
            if (!currentCategories.includes(junkFoodId)) {
                section.categories.push(new mongoose.Types.ObjectId(junkFoodId));
                await section.save();
                console.log('Added Junk Food to Fast Foods section successfully.');
            } else {
                console.log('Junk Food already in section.');
            }
        } else {
            console.log('Section "Fast Foods" not found. Creating it...');
            const foodHeaderId = "69b13f5764b2b9715d4cea47";
             await HomeSection.create({
                title: "Fast Foods",
                displayType: "categories",
                categories: [new mongoose.Types.ObjectId(junkFoodId)],
                targetHeaderCategory: new mongoose.Types.ObjectId(foodHeaderId),
                pageLocation: "Header Category Page",
                isActive: true,
                order: 1
            });
            console.log('Created new "Fast Foods" section with Junk Food.');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

update();
