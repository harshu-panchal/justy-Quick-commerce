const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function findOrderInfo() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/justy';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const orderItemId = '69c775d56a8b819255dff58e';
    
    // Using dynamic model access since we are in JS
    const OrderItem = mongoose.connection.collection('orderitems');
    const Product = mongoose.connection.collection('products');
    const Seller = mongoose.connection.collection('sellers');

    const item = await OrderItem.findOne({ _id: new mongoose.Types.ObjectId(orderItemId) });
    
    if (!item) {
      console.log('Order Item not found');
      return;
    }

    console.log('\n--- Order Item Info ---');
    console.log('Product Name:', item.productName);
    console.log('Product ID:', item.product);
    console.log('Seller ID:', item.seller);
    console.log('Quantity:', item.quantity);
    console.log('Total:', item.total);

    const product = await Product.findOne({ _id: item.product });
    if (product) {
      console.log('\n--- Product Info ---');
      console.log('Name:', product.productName);
      console.log('Category:', product.category);
    }

    const seller = await Seller.findOne({ _id: item.seller });
    if (seller) {
      console.log('\n--- Seller Info ---');
      console.log('Store Name:', seller.storeName);
      console.log('Seller Name:', seller.sellerName);
      console.log('Phone:', seller.mobile);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

findOrderInfo();
