const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/Administrator/Documents/GitHub/justy-Quick-commerce/backend/.env' });

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Seller = mongoose.model('Seller', new mongoose.Schema({}, { strict: false }), 'sellers');
    const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }), 'categories');
    const HeaderCategory = mongoose.model('HeaderCategory', new mongoose.Schema({}, { strict: false }), 'headercategories');

    const seller = await Seller.findOne({ status: 'Approved' });
    const headerCategory = await HeaderCategory.findOne({ status: 'Published' });
    const category = await Category.findOne({ headerCategoryId: headerCategory?._id });

    console.log('--- Found Data ---');
    console.log('Seller:', seller ? { id: seller._id, name: seller.storeName } : 'None');
    console.log('Header Category:', headerCategory ? { id: headerCategory._id, name: headerCategory.name } : 'None');
    console.log('Category:', category ? { id: category._id, name: category.name } : 'None');

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkData();
