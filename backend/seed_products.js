const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: 'c:/Users/Administrator/Documents/GitHub/justy-Quick-commerce/backend/.env' });

const images = [
  {
    path: 'C:/Users/Administrator/.gemini/antigravity/brain/ab53a46b-e352-41ab-8222-1bed0433b1ff/paneer_tikka_1774950160723.png',
    name: 'Special Paneer Tikka',
    description: 'Smokey and spicy grilled paneer with artisanal touch.',
    price: 250,
    foodType: 'Veg'
  },
  {
    path: 'C:/Users/Administrator/.gemini/antigravity/brain/ab53a46b-e352-41ab-8222-1bed0433b1ff/butter_chicken_1774950179473.png',
    name: 'Butter Chicken Masala',
    description: 'Rich and creamy tomato based gravy with tender chicken chunks.',
    price: 350,
    foodType: 'Non-Veg'
  },
  {
    path: 'C:/Users/Administrator/.gemini/antigravity/brain/ab53a46b-e352-41ab-8222-1bed0433b1ff/veg_biryani_1774950199558.png',
    name: 'Hyderabadi Veg Biryani',
    description: 'Fragrant saffron rice with seasonal vegetables and traditional spices.',
    price: 220,
    foodType: 'Veg'
  }
];

const SELLER_ID = '6964b1733e4ae3afaa996a76';
const HEADER_ID = '698ae36bd1dd070a1028685e';
const CAT_ID = '69aff9f189cb4cf8fca1d8ac';

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('✓ Configured Cloudinary');

    const ProductsCollection = mongoose.connection.collection('products');

    for (const item of images) {
      console.log(`Uploading image for ${item.name}...`);
      const uploadRes = await cloudinary.uploader.upload(item.path, {
        folder: 'dhakadsnazzy/products',
        resource_type: 'image'
      });
      console.log(`✓ Image uploaded: ${uploadRes.secure_url}`);

      const product = {
        productName: item.name,
        smallDescription: item.description,
        description: item.description,
        category: new mongoose.Types.ObjectId(CAT_ID),
        headerCategoryId: new mongoose.Types.ObjectId(HEADER_ID),
        seller: new mongoose.Types.ObjectId(SELLER_ID),
        mainImage: uploadRes.secure_url,
        galleryImages: [],
        price: item.price,
        discPrice: item.price - 20, // Small discount for all seed data
        stock: 100,
        publish: true,
        popular: true,
        dealOfDay: false,
        status: 'Active',
        foodType: item.foodType,
        preparationTime: 25,
        availabilityStatus: 'Available',
        packagingPrice: 10,
        tags: ['food', 'indian', item.name.toLowerCase()],
        subcategoryModel: 'Category',
        isReturnable: false,
        cancelAvailable: true,
        rating: 4.5,
        reviewsCount: 1,
        discount: Math.round((20 / item.price) * 100),
        createdAt: new Date(),
        updatedAt: new Date(),
        variations: [
          {
            name: "Standard",
            value: "One Size",
            price: item.price,
            discPrice: item.price - 20,
            stock: 100,
            status: "Available"
          }
        ]
      };

      await ProductsCollection.insertOne(product);
      console.log(`✓ Product created: ${item.name}`);
    }

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    console.log('\nAll 3 products added successfully!');
  } catch (err) {
    console.error('Error seeding products:', err);
  }
}

seedProducts();
