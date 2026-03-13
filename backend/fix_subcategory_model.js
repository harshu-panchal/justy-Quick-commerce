/**
 * Migration Script: Fix wrong subcategoryModel on existing products
 *
 * Problem: Some products were saved with subcategoryModel: "SubCategory"
 * even though their subcategory ID actually points to a Category document
 * (new-style subcategory hierarchy). This causes Mongoose populate() to fail,
 * making subcategory appear as null in admin dashboard, and products potentially
 * not appearing on user-facing subcategory pages.
 *
 * Run this script ONCE with:
 *   node fix_subcategory_model.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in environment variables");
  process.exit(1);
}

// Minimal schemas for migration
const ProductSchema = new mongoose.Schema({}, { strict: false });
const SubCategorySchema = new mongoose.Schema({}, { strict: false });
const CategorySchema = new mongoose.Schema({}, { strict: false });

const Product = mongoose.model("Product", ProductSchema);
const SubCategory = mongoose.model("SubCategory", SubCategorySchema, "subcategories");
const Category = mongoose.model("Category", CategorySchema, "categories");

async function fixSubcategoryModels() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // Find all products that have a subcategory set
  const products = await Product.find({
    subcategory: { $exists: true, $ne: null },
  }).lean();

  console.log(`\n📦 Found ${products.length} products with subcategory set`);

  let fixed = 0;
  let alreadyCorrect = 0;
  let noMatch = 0;

  for (const product of products) {
    const subcategoryId = product.subcategory;
    if (!subcategoryId) continue;

    // Check if it exists in SubCategory collection
    const inSubCategory = await SubCategory.findById(subcategoryId).lean();
    const inCategory = !inSubCategory
      ? await Category.findById(subcategoryId).lean()
      : null;

    let correctModel;
    if (inSubCategory) {
      correctModel = "SubCategory";
    } else if (inCategory) {
      correctModel = "Category";
    } else {
      console.log(
        `  ⚠️  Product ${product._id} (${product.productName}): subcategory ID ${subcategoryId} not found in either collection`
      );
      noMatch++;
      continue;
    }

    if (product.subcategoryModel === correctModel) {
      alreadyCorrect++;
    } else {
      console.log(
        `  🔧 Fixing product ${product._id} (${product.productName}): ${product.subcategoryModel} → ${correctModel}`
      );
      await Product.updateOne(
        { _id: product._id },
        { $set: { subcategoryModel: correctModel } }
      );
      fixed++;
    }
  }

  console.log("\n📊 Migration Summary:");
  console.log(`   ✅ Already correct: ${alreadyCorrect}`);
  console.log(`   🔧 Fixed:           ${fixed}`);
  console.log(`   ⚠️  No match found:  ${noMatch}`);
  console.log(`   📦 Total checked:   ${products.length}`);

  await mongoose.disconnect();
  console.log("\n✅ Done. MongoDB disconnected.");
}

fixSubcategoryModels().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
