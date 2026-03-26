import connectDB from '../config/db';
import { generateAndAttachQr } from '../services/qrService';
import EquipmentOrder from '../models/EquipmentOrder';

const orderId = "69c4cba53077d843708f8cc7";

async function debug() {
  try {
    await connectDB();
    console.log("DB Connected");

    const order = await EquipmentOrder.findById(orderId);
    if (!order) {
      console.error("Order not found:", orderId);
      process.exit(1);
    }

    console.log("Current status:", order.status);
    console.log("Current QR URL:", order.qrCodeUrl || "None");

    console.log("Triggering manual QR generation...");
    await generateAndAttachQr(orderId, 'EQUIPMENT');
    
    // Fetch again to verify
    const updatedOrder = await EquipmentOrder.findById(orderId);
    console.log("Updated QR URL:", updatedOrder?.qrCodeUrl || "STILL MISSING");

    process.exit(0);
  } catch (err) {
    console.error("Debug failed:", err);
    process.exit(1);
  }
}

debug();
