const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const HeaderCategory = require('../src/models/HeaderCategory').default;
const Category = require('../src/models/Category').default;
const HomeSection = require('../src/models/HomeSection').default;

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');

        const headerCategory = await HeaderCategory.findById("69b13f5764b2b9715d4cea47");
        console.log('Header Category:', headerCategory?.name, headerCategory?.slug);

        const sections = await HomeSection.find({ targetHeaderCategory: "69b13f5764b2b9715d4cea47" }).populate('categories');
        console.log('Sections found:', sections.length);
        sections.forEach(s => {
            console.log('Section:', s.title, s.displayType);
            console.log('Categories in section:', s.categories.map(c => c.name));
        });

        const allCategoriesInHeader = await Category.find({ headerCategoryId: "69b13f5764b2b9715d4cea47" });
        console.log('All categories in this header:', allCategoriesInHeader.map(c => c.name));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
