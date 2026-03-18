import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Plan from "../models/Plan";
import { createRazorpayPlan } from "../services/razorpaySubscriptionService";

// Explicitly load .env from backend root (same style as other scripts)
dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dhakadsnazzy";

const seedPlans = [
  {
    planType: "Customer" as const,
    name: "Monthly Basic",
    amount: 199,
    period: "monthly" as const,
    points: ["Customer support", "Standard delivery", "Regular offers access"],
    isActive: true,
  },
  {
    planType: "Customer" as const,
    name: "Monthly Pro",
    amount: 399,
    period: "monthly" as const,
    points: ["Priority support", "Extra savings offers", "Faster delivery slots"],
    isActive: true,
  },
  {
    planType: "Customer" as const,
    name: "Monthly Premium",
    amount: 699,
    period: "monthly" as const,
    points: ["Dedicated support", "Maximum savings", "Early access to deals"],
    isActive: true,
  },

  {
    planType: "Seller" as const,
    name: "Monthly Basic",
    amount: 499,
    period: "monthly" as const,
    points: ["Seller support", "Standard listing tools", "Basic analytics"],
    isActive: true,
  },
  {
    planType: "Seller" as const,
    name: "Monthly Pro",
    amount: 999,
    period: "monthly" as const,
    points: ["Priority support", "Enhanced analytics", "Early access to features"],
    isActive: true,
  },
  {
    planType: "Seller" as const,
    name: "Monthly Premium",
    amount: 1999,
    period: "monthly" as const,
    points: ["Dedicated support", "Growth insights", "Priority promotions eligibility"],
    isActive: true,
  },

  {
    planType: "DeliveryPartner" as const,
    name: "Monthly Basic",
    amount: 299,
    period: "monthly" as const,
    points: ["Partner support", "Standard incentives access", "Basic onboarding help"],
    isActive: true,
  },
  {
    planType: "DeliveryPartner" as const,
    name: "Monthly Pro",
    amount: 499,
    period: "monthly" as const,
    points: ["Priority onboarding", "Better incentives access", "Support priority"],
    isActive: true,
  },
  {
    planType: "DeliveryPartner" as const,
    name: "Monthly Premium",
    amount: 799,
    period: "monthly" as const,
    points: ["Dedicated support", "Top-tier incentives access", "Early access to partner programs"],
    isActive: true,
  },
];

async function main() {
  console.log("Seeding plans…");
  console.log(`Mongo: ${MONGO_URI}`);

  await mongoose.connect(MONGO_URI);

  for (const p of seedPlans) {
    const existing = await Plan.findOne({ name: p.name, planType: p.planType });
    if (existing) {
      console.log(`- Skipping (already exists): ${p.planType} / ${p.name}`);
      continue;
    }

    const rp = await createRazorpayPlan({
      name: `${p.planType} - ${p.name}`.slice(0, 120),
      description: p.points.join(" | ").slice(0, 255),
      amountInRupees: p.amount,
      currency: "INR",
      period: p.period,
      interval: 1,
    });

    await Plan.create({
      planType: p.planType,
      name: p.name,
      amount: p.amount,
      currency: "INR",
      period: p.period,
      points: p.points,
      isActive: p.isActive,
      razorpayPlanId: rp.id,
    });

    console.log(`+ Created: ${p.planType} / ${p.name} (Razorpay: ${rp.id})`);
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});

