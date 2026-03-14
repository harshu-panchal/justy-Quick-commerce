const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Seller = mongoose.model('Seller', new mongoose.Schema({}, {strict:false}), 'sellers');
  const Product = mongoose.model('Product', new mongoose.Schema({}, {strict:false}));

  const recent = await Seller.find().sort({ createdAt: -1 }).limit(5)
    .select('_id storeName status depositPaid isActive isShopOpen location latitude longitude serviceRadiusKm createdAt requireProductApproval')
    .lean();

  console.log('=== RECENT SELLERS ===');
  recent.forEach(s => {
    console.log(`\nSeller: ${s.storeName} (${s._id})`);
    console.log(`  status: ${s.status}`);
    console.log(`  depositPaid: ${s.depositPaid}`);
    console.log(`  isActive: ${s.isActive}`);
    console.log(`  isShopOpen: ${s.isShopOpen}`);
    console.log(`  requireProductApproval: ${s.requireProductApproval}`);
    console.log(`  location.coordinates: ${s.location ? JSON.stringify(s.location.coordinates) : 'NONE'}`);
    console.log(`  lat/lng strings: ${s.latitude} / ${s.longitude}`);
    console.log(`  serviceRadiusKm: ${s.serviceRadiusKm}`);
    console.log(`  createdAt: ${s.createdAt}`);
  });

  // Products from recent sellers
  const recentSellerIds = recent.map(s => s._id);
  const products = await Product.find({ seller: { $in: recentSellerIds } })
    .select('_id productName status publish seller subcategory subcategoryModel')
    .lean();
  console.log('\n=== PRODUCTS FROM RECENT SELLERS ===');
  products.forEach(p => {
    const seller = recent.find(s => s._id.toString() === p.seller.toString());
    console.log(`  ${p.productName} | status:${p.status} | publish:${p.publish} | seller:${seller?.storeName}`);
  });

  await mongoose.disconnect();
}
main().catch(console.error);
