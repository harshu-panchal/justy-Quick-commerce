const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('Connected to DB');
  
  const Category = mongoose.model('Category', new mongoose.Schema({ name: String, slug: String, parentId: mongoose.Schema.Types.ObjectId, status: String }));
  const Product = mongoose.model('Product', new mongoose.Schema({ productName: String, category: mongoose.Schema.Types.ObjectId, subcategory: mongoose.Schema.Types.ObjectId, status: String, publish: Boolean }));
  
  const bread = await Category.findOne({ slug: 'bread' });
  console.log('Bread Category:', JSON.stringify(bread));
  
  if (bread) {
    const products = await Product.find({ 
      $or: [
        { subcategory: bread._id },
        { category: bread._id }
      ]
    });
    console.log('Products for Bread:', JSON.stringify(products));
  } else {
    // Try search by name
    const breadByName = await Category.findOne({ name: /Bread/i });
    console.log('Bread by Name:', JSON.stringify(breadByName));
    if (breadByName) {
        const products = await Product.find({ 
            $or: [
                { subcategory: breadByName._id },
                { category: breadByName._id }
            ]
        });
        console.log('Products for Bread (by name):', JSON.stringify(products));
    }
  }
  
  process.exit(0);
}
run();
