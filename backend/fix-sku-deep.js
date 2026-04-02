const mongoose = require('mongoose');
require('dotenv').config();

async function deepCleanSkus() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/justy');
  const collection = mongoose.connection.collection('products');
  
  console.log('Unsetting all empty/null SKU strings...');
  const result = await collection.updateMany(
    { $or: [ { sku: "" }, { sku: null } ] },
    { $unset: { sku: "" } }
  );
  console.log(`Unset sku for ${result.modifiedCount} products.`);

  console.log('Fetching indexes...');
  const indexes = await collection.indexes();
  const skuIndex = indexes.find(idx => idx.key && idx.key.sku);
  
  if (skuIndex) {
    console.log('Dropping existing sku index...');
    await collection.dropIndex(skuIndex.name);
  }
  
  console.log('Recreating sparse unique index for sku...');
  await collection.createIndex({ sku: 1 }, { unique: true, sparse: true });
  console.log('Index recreation complete.');

  process.exit(0);
}

deepCleanSkus();
