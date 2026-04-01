
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkSKUs() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');

        const Product = mongoose.connection.collection('products');
        const products = await Product.find({}).toArray();

        console.log(`Total products: ${products.length}`);
        
        const skus = products.map(p => ({
            name: p.productName,
            sku: p.sku || "N/A"
        }));

        console.log('Products SKUs summary:', JSON.stringify(skus.slice(0, 10), null, 2));

        const emptySKUCount = products.filter(p => p.sku === "").length;
        const nullSKUCount = products.filter(p => p.sku === null).length;
        const undefinedSKUCount = products.filter(p => p.sku === undefined).length;

        console.log(`Empty String SKU count: ${emptySKUCount}`);
        console.log(`Null SKU count: ${nullSKUCount}`);
        console.log(`Undefined SKU count: ${undefinedSKUCount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSKUs();
