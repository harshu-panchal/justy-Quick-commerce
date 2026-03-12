import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import Product from "../src/models/Product";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function checkLatest() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI not found");
    
    await mongoose.connect(mongoUri);
    console.log("Connected to DB");

    const p = await Product.findOne().sort({ createdAt: -1 }).lean();
    if (p) {
      fs.writeFileSync("latest_product.json", JSON.stringify(p, null, 2), "utf8");
      console.log("Written to latest_product.json");
    } else {
      console.log("No products found");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkLatest();
