const mongoose = require('mongoose');
require('dotenv').config();

async function checkDuplicateSkus() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/justy');
  const Product = mongoose.model('Product', new mongoose.Schema({ sku: String }));
  
  const duplicates = await Product.aggregate([
    { $group: { _id: "$sku", count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  
  console.log('Duplicate SKUs found:');
  console.log(JSON.stringify(duplicates, null, 2));
  
  process.exit(0);
}

checkDuplicateSkus();
