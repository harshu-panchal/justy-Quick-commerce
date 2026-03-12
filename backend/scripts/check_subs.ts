import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import Product from "../src/models/Product";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function checkSubcategories() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI not found");
    
    await mongoose.connect(mongoUri);
    console.log("Connected to DB");

    const totalProducts = await Product.countDocuments();
    const withSub = await Product.countDocuments({ subcategory: { $exists: true, $ne: null } });
    const withoutSub = await Product.countDocuments({ $or: [{ subcategory: { $exists: false } }, { subcategory: null }] });

    const recentProducts = await Product.find().sort({ createdAt: -1 }).limit(10).lean();
    
    let report = `Total Products: ${totalProducts}\n`;
    report += `With Subcategory: ${withSub}\n`;
    report += `Without Subcategory: ${withoutSub}\n\n`;
    report += `Recent 10 Products Details:\n`;
    
    recentProducts.forEach(p => {
      report += `- Name: ${p.productName}\n`;
      report += `  ID: ${p._id}\n`;
      report += `  Sub: ${p.subcategory || 'NULL'}\n`;
      report += `  Model: ${p.subcategoryModel || 'UNDEFINED'}\n`;
      report += `  Created: ${p.createdAt}\n`;
      report += `-------------------\n`;
    });

    fs.writeFileSync("subcategory_report.txt", report, "utf8");
    console.log("Report written to subcategory_report.txt");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSubcategories();
