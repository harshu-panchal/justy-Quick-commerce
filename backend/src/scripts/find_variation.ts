import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function findVariation() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const variationId = '69b3a9fd60da8138bcad0cfb';
    
    // Define a simple Product schema for searching
    const ProductSchema = new mongoose.Schema({
      productName: String,
      variations: [{
        _id: mongoose.Schema.Types.ObjectId,
        title: String,
        value: String,
        pack: String,
        stock: Number,
        price: Number
      }]
    }, { strict: false });

    const Product = mongoose.model('ProductSearching', ProductSchema, 'products');

    const product = await Product.findOne({
      "variations._id": new mongoose.Types.ObjectId(variationId)
    });

    if (product) {
      console.log('Found Product:', product.get('productName'));
      const variations = product.get('variations');
      const variation = variations.find((v: any) => v._id.toString() === variationId);
      console.log('Variation Details:', variation);
    } else {
      console.log('No product found with variation ID:', variationId);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

findVariation();
