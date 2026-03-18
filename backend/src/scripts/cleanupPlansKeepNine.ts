import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Plan from "../models/Plan";

// Explicitly load .env from backend root
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dhakadsnazzy";

type PlanType = "Customer" | "Seller" | "DeliveryPartner";

const keep: Array<{ planType: PlanType; name: string }> = [
  // Customer (3)
  { planType: "Customer", name: "Monthly Basic" },
  { planType: "Customer", name: "Monthly Pro" },
  { planType: "Customer", name: "Monthly Premium" },

  // Seller (3)
  { planType: "Seller", name: "Monthly Basic" },
  { planType: "Seller", name: "Monthly Pro" },
  { planType: "Seller", name: "Monthly Premium" },

  // DeliveryPartner (3)
  { planType: "DeliveryPartner", name: "Monthly Basic" },
  { planType: "DeliveryPartner", name: "Monthly Pro" },
  { planType: "DeliveryPartner", name: "Monthly Premium" },
];

async function main() {
  console.log("Cleaning plans (keep only 9) …");
  console.log(`Mongo: ${MONGO_URI}`);

  await mongoose.connect(MONGO_URI);

  const keepOr: any[] = keep.map((k) => ({ planType: k.planType, name: k.name }));

  const toDelete = await Plan.find({ $nor: keepOr })
    .select("_id planType name razorpayPlanId isActive createdAt")
    .lean();

  console.log(`Found ${toDelete.length} plan(s) to delete.`);
  for (const p of toDelete) {
    console.log(`- delete: ${p.planType} / ${p.name} (${p.razorpayPlanId || "no_razorpay_id"})`);
  }

  if (toDelete.length > 0) {
    const ids = toDelete.map((p) => p._id);
    const res = await Plan.deleteMany({ _id: { $in: ids } });
    console.log(`Deleted ${res.deletedCount || 0} plan(s).`);
  }

  const remaining = await Plan.find()
    .select("planType name razorpayPlanId isActive")
    .sort({ planType: 1, name: 1 })
    .lean();
  console.log(`Remaining ${remaining.length} plan(s):`);
  for (const p of remaining) {
    console.log(`+ keep: ${p.planType} / ${p.name} (${p.razorpayPlanId || "no_razorpay_id"})`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch(async (err) => {
  console.error("Cleanup failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});

