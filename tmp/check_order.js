const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://rounak_user:raunak123@cluster0.dpunra8.mongodb.net/Justi";
const orderId = "69c4cba53077d843708f8cc7";

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const order = await mongoose.connection.db.collection('equipmentorders').findOne({ _id: new mongoose.Types.ObjectId(orderId) });
    
    if (order) {
      console.log("Order found:", order.orderNumber);
      console.log("Status:", order.status);
      console.log("QR Code URL:", order.qrCodeUrl);
      console.log("QR Data:", order.qrData ? "Exists" : "Missing");
      console.log("Entire Order:", JSON.stringify(order, null, 2));
    } else {
      console.log("Order not found with ID:", orderId);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

check();
