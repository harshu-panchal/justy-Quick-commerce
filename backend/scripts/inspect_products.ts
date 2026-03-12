import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Product from "../src/models/Product";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function inspectProducts() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI not found");
    
    await mongoose.connect(mongoUri);
    console.log("Connected to DB");

    const products = await Product.find().sort({ createdAt: -1 }).limit(5).lean();
    console.log("Last 5 Products:");
    products.forEach(p => {
      console.log(`- Name: ${p.productName}`);
      console.log(`  SubCategory: ${p.subcategory}`);
      console.log(`  SubCategoryModel: ${p.subcategoryModel}`);
      console.log(`  Category: ${p.category}`);
      console.log(`  CreatedAt: ${p.createdAt}`);
      console.log('---');
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectProducts();
