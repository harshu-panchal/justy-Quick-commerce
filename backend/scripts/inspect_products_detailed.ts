import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Product from "../src/models/Product";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function inspectProductsDetailed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI not found");
    
    await mongoose.connect(mongoUri);
    console.log("Connected to DB");

    const products = await Product.find().sort({ createdAt: -1 }).limit(10).lean();
    console.log("LAST_10_PRODUCTS_JSON_START");
    console.log(JSON.stringify(products, null, 2));
    console.log("LAST_10_PRODUCTS_JSON_END");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectProductsDetailed();
