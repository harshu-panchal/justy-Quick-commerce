import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Product from "../src/models/Product";
import Category from "../src/models/Category";
import SubCategory from "../src/models/SubCategory";
import Seller from "../src/models/Seller";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function verifyFix() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI not found");
    
    await mongoose.connect(mongoUri);
    console.log("Connected to DB");

    // 1. Find a seller
    const seller = await Seller.findOne();
    if (!seller) throw new Error("No seller found");
    console.log(`Using seller: ${seller._id}`);

    // 2. Find/Create an old-style subcategory
    let oldSub = await SubCategory.findOne();
    if (!oldSub) {
       const cat = await Category.findOne({ parentId: null });
       if (cat) {
         oldSub = await SubCategory.create({ name: "Test Old Sub", category: cat._id });
       }
    }
    
    // 3. Find/Create a new-style subcategory (Category with parentId)
    let newSub = await Category.findOne({ parentId: { $ne: null } });
    if (!newSub) {
       const cat = await Category.findOne({ parentId: null });
       if (cat) {
         newSub = await Category.create({ name: "Test New Sub", parentId: cat._id, order: 1 });
       }
    }

    console.log(`Old Sub ID: ${oldSub?._id} (Model: SubCategory)`);
    console.log(`New Sub ID: ${newSub?._id} (Model: Category)`);

    // 4. Create product with old sub
    const p1 = await Product.create({
      productName: "Test Product Old Sub",
      seller: seller._id,
      category: oldSub?.category || newSub?.parentId,
      subcategory: oldSub?._id,
      subcategoryModel: "SubCategory",
      price: 100,
      stock: 10,
      publish: true
    });

    // 5. Create product with new sub
    const p2 = await Product.create({
      productName: "Test Product New Sub",
      seller: seller._id,
      category: newSub?.parentId,
      subcategory: newSub?._id,
      subcategoryModel: "Category",
      price: 200,
      stock: 20,
      publish: true
    });

    // 6. Retrieve and populate
    const products = await Product.find({ _id: { $in: [p1._id, p2._id] } })
      .populate("subcategory", "name");

    console.log("\nVerification Results:");
    products.forEach(p => {
      console.log(`Product: ${p.productName}`);
      console.log(`SubCategory populated: ${JSON.stringify(p.subcategory)}`);
      if (p.subcategory && (p.subcategory as any).name) {
          console.log(`✅ Success: Found subcategory name: ${(p.subcategory as any).name}`);
      } else {
          console.log(`❌ Failure: Subcategory NOT populated correctly`);
      }
    });

    // Cleanup
    await Product.deleteMany({ _id: { $in: [p1._id, p2._id] } });
    console.log("\nCleanup done.");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

verifyFix();
