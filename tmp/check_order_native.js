const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://rounak_user:raunak123@cluster0.dpunra8.mongodb.net/Justi";
const dbName = "Justi";
const orderId = "69c4cba53077d843708f8cc7";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db(dbName);
    const collection = db.collection('equipmentorders');
    
    const order = await collection.findOne({ _id: new ObjectId(orderId) });
    
    if (order) {
      console.log("Order found:", order.orderNumber);
      console.log("Status:", order.status);
      console.log("QR Code URL:", order.qrCodeUrl || "MISSING");
      console.log("QR Data:", order.qrData ? "Exists" : "MISSING");
      console.log("QR Generated At:", order.qrGeneratedAt || "MISSING");
    } else {
      console.log("Order not found with ID:", orderId);
    }
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
