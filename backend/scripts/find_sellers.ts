import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Seller from "../src/models/Seller";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function checkSellers() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI not found");
    
    await mongoose.connect(mongoUri);
    console.log("Connected to DB");

    const sellers = await Seller.find({ status: "Approved" }).limit(5);
    console.log("Approved Sellers:");
    sellers.forEach(s => {
      console.log(`Email: ${s.email}, Store: ${s.storeName}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSellers();
