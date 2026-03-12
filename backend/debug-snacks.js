const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://prachi:7694900512@cluster0.nd3xlri.mongodb.net/zeto-mart?retryWrites=true&w=majority')
  .then(async () => {
    try {
      const cat = await mongoose.connection.collection('categories').findOne({ name: /Snack/i });
      if (!cat) { console.log('No Snacks cat found'); process.exit(0); }
      
      const subIds = await mongoose.connection.collection('categories').find({parentId: cat._id}).toArray();
      const ids = [cat._id, ...subIds.map(s=>s._id)];
      
      const prods = await mongoose.connection.collection('products').find({ 
        $or: [{category: {$in: ids}}, {subcategory: {$in: ids}}] 
      }).toArray();
      
      console.log('Found prods matching Snacks or Subcategories:');
      console.dir(prods.map(p => ({
        name: p.productName, 
        subcat: p.subcategory, 
        cat: p.category,
        pub: p.publish,
        status: p.status
      })), {depth: null});

    } catch(err) {
      console.error(err);
    }
    process.exit(0);
  });
