import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Product from "../src/models/Product";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function checkSchema() {
  try {
    console.log("Product Schema Paths:");
    const paths = Object.keys(Product.schema.paths);
    console.log(JSON.stringify(paths, null, 2));
    
    if (paths.includes("subcategoryModel")) {
      console.log("✅ subcategoryModel found in schema");
      console.log("Subcategory refPath:", (Product.schema.paths.subcategory as any).options.refPath);
    } else {
      console.log("❌ subcategoryModel NOT found in schema");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
