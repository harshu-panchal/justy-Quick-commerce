const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Use compiled JS files from dist/models
const Order = require('./dist/models/Order').default;
const OrderItem = require('./dist/models/OrderItem').default;
const Product = require('./dist/models/Product').default;
const Seller = require('./dist/models/Seller').default;

async function getDetails() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in .env');
      return;
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const orderItemId = '69c769a47a695180262d62cc';
    console.log('Searching for OrderItem:', orderItemId);
    
    const item = await OrderItem.findById(orderItemId).populate('product').populate('seller');

    if (!item) {
      console.log('OrderItem not found');
      // List a few recent order items to check if the ID is valid
      const recentItems = await OrderItem.find().sort({ createdAt: -1 }).limit(3);
      console.log('Recent OrderItem IDs in DB:', recentItems.map(i => i._id.toString()));
      return;
    }

    console.log('\n--- Order Item Details ---');
    console.log('ID:', item._id);
    console.log('Product Name:', item.productName);
    console.log('Unit Price:', item.unitPrice);
    console.log('Quantity:', item.quantity);
    console.log('Total:', item.total);

    console.log('\n--- Product Details (Live) ---');
    if (item.product) {
      console.log('ID:', item.product._id);
      console.log('Live Name:', item.product.productName);
      console.log('Stock:', item.product.stock);
    } else {
      console.log('Product not found in database');
    }

    console.log('\n--- Seller Details ---');
    if (item.seller) {
      console.log('ID:', item.seller._id);
      console.log('Store Name:', item.seller.storeName);
      console.log('Seller Name:', item.seller.sellerName);
      console.log('Mobile:', item.seller.mobile);
      console.log('Email:', item.seller.email);
      console.log('Pincode:', item.seller.pincode);
    } else {
      console.log('Seller not found in database');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

getDetails();
