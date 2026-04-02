const mongoose = require('mongoose');
require('dotenv').config();

async function fixSkuIndex() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/justy');
  const collection = mongoose.connection.collection('products');
  
  console.log('Fetching indexes...');
  const indexes = await collection.indexes();
  console.log('Current indexes:', JSON.stringify(indexes, null, 2));
  
  const skuIndex = indexes.find(idx => idx.key && idx.key.sku);
  if (skuIndex) {
    if (skuIndex.unique && !skuIndex.sparse) {
      console.log('sku index is unique but not sparse. Dropping and recreating...');
      await collection.dropIndex(skuIndex.name);
      await collection.createIndex({ sku: 1 }, { unique: true, sparse: true });
      console.log('Fixed sku index.');
    } else {
      console.log('sku index is already unique and sparse (or other).');
    }
  } else {
    console.log('No sku index found. Creating sparse unique index...');
    await collection.createIndex({ sku: 1 }, { unique: true, sparse: true });
    console.log('Created sku index.');
  }
  
  // Also clean up any empty string SKUs
  console.log('Cleaning up empty string SKUs...');
  const result = await collection.updateMany({ sku: "" }, { $set: { sku: null } });
  console.log(`Updated ${result.modifiedCount} products with empty SKU strings.`);

  process.exit(0);
}

fixSkuIndex();
