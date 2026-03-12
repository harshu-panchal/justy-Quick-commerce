const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://prachi:7694900512@cluster0.nd3xlri.mongodb.net/zeto-mart?retryWrites=true&w=majority')
  .then(async () => {
    try {
      const cat = await mongoose.connection.collection('categories').findOne({ name: /Rice2/i });
      console.log('Category Rice2:', cat);
      if (cat) {
        console.log('Rice2 _id TYPE:', typeof cat._id);

        const prods = await mongoose.connection.collection('products').find({ subcategory: cat._id }).toArray();
        console.log(`Products matching Rice2 _id directly (${cat._id}):`, prods.length);
        if (prods.length > 0) console.log('Sample product matching Rice2:', prods[0].productName);

        const prodsStr = await mongoose.connection.collection('products').find({ subcategory: cat._id.toString() }).toArray();
        console.log(`Products matching Rice2 string id (${cat._id.toString()}):`, prodsStr.length);

        const allProds = await mongoose.connection.collection('products').find({ productName: /Rice/i }).toArray();
        console.log(`Products with Rice in name:`, allProds.map(p => ({ name: p.productName, subcategory: p.subcategory, category: p.category, subcategoryModel: p.subcategoryModel })));
      }
    } catch(err) {
      console.error(err);
    }
    process.exit(0);
  });
