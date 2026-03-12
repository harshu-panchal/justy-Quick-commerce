import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import SubCategory from "../src/models/SubCategory";
import Category from "../src/models/Category";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function findSource() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI not found");
    
    await mongoose.connect(mongoUri);
    console.log("Connected to DB");

    const idToCheck = "69b282eca8decb2ef98e625e";
    
    const inSubCategory = await SubCategory.findById(idToCheck);
    const inCategory = await Category.findById(idToCheck);

    console.log(`ID: ${idToCheck}`);
    console.log(`Found in SubCategory: ${inSubCategory ? 'YES (Name: ' + inSubCategory.name + ')' : 'NO'}`);
    console.log(`Found in Category: ${inCategory ? 'YES (Name: ' + inCategory.name + ')' : 'NO'}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findSource();
