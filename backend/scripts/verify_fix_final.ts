import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Product from "../src/models/Product";
import SubCategory from "../src/models/SubCategory";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function verifyFix() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI not found");
    
    await mongoose.connect(mongoUri);
    console.log("Connected to DB");

    // Use an existing subcategory ID (the one we found earlier)
    const subId = "69b282eca8decb2ef98e625e"; // Bread
    const sellerId = "69affa1689cb4cf8fca1da5b"; // A random seller ID from DB if possible, or just a placeholder if validation allows
    
    // Find a real seller ID first
    const anyProduct = await Product.findOne().lean();
    const realSellerId = anyProduct?.seller;

    console.log(`Creating test product with subcategory ${subId} and seller ${realSellerId}`);

    // Detect model manually like the controller does
    const isOldSub = await SubCategory.findById(subId);
    const subModel = isOldSub ? "SubCategory" : "Category";

    const testProduct = await Product.create({
      productName: "Test Product " + Date.now(),
      category: "69affb2a2ace0497296cc378", // Grocery
      subcategory: subId,
      subcategoryModel: subModel,
      seller: realSellerId,
      price: 100,
      stock: 10,
      publish: true,
      status: "Active"
    });

    console.log("Product created:", testProduct._id);
    console.log("Saved subcategoryModel:", testProduct.subcategoryModel);

    // Verify after saving
    const saved = await Product.findById(testProduct._id).lean();
    console.log("Verified in DB:", saved?.subcategoryModel);

    // Cleanup
    await Product.findByIdAndDelete(testProduct._id);
    console.log("Test product cleaned up");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verifyFix();
