import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Product from "../src/models/Product";
import SubCategory from "../src/models/SubCategory";
import Category from "../src/models/Category";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function migrateProducts() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI not found");
    
    await mongoose.connect(mongoUri);
    console.log("Connected to DB");

    const products = await Product.find({ 
      subcategory: { $exists: true, $ne: null },
      $or: [{ subcategoryModel: { $exists: false } }, { subcategoryModel: null }]
    });

    console.log(`Found ${products.length} products to migrate`);

    let migratedCount = 0;
    for (const product of products) {
      const subId = product.subcategory;
      
      // Check if it exists in SubCategory
      const isOldSub = await SubCategory.findById(subId);
      if (isOldSub) {
        product.subcategoryModel = "SubCategory";
      } else {
        // Check if it exists in Category
        const isNewSub = await Category.findById(subId);
        if (isNewSub) {
          product.subcategoryModel = "Category";
        } else {
          console.log(`Warning: Subcategory ${subId} not found in either collection for product ${product._id}`);
          continue;
        }
      }

      await product.save();
      migratedCount++;
    }

    console.log(`Successfully migrated ${migratedCount} products`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrateProducts();
