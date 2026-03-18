import Razorpay from "razorpay";
import crypto from "crypto";

export type RazorpayPlanPeriod = "daily" | "weekly" | "monthly" | "yearly";

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function createRazorpayPlan(input: {
  name: string;
  description?: string;
  amountInRupees: number;
  currency?: "INR";
  period: RazorpayPlanPeriod;
  interval: number;
}): Promise<{ id: string }> {
  const razorpay = getRazorpayInstance();

  // Razorpay expects amount in paise
  const amount = Math.round(Number(input.amountInRupees) * 100);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Invalid plan amount");
  }

  const plan = await razorpay.plans.create({
    period: input.period,
    interval: input.interval,
    item: {
      name: input.name,
      amount,
      currency: input.currency || "INR",
      description: input.description,
    },
  } as any);

  return { id: plan.id };
}

export async function createRazorpaySubscription(input: {
  planId: string;
  totalCount?: number; // number of billing cycles
  customerNotify?: 0 | 1;
  notes?: Record<string, string>;
}): Promise<{ id: string; status: string; shortUrl?: string }> {
  const razorpay = getRazorpayInstance();
  const subscription = await (razorpay as any).subscriptions.create({
    plan_id: input.planId,
    total_count: typeof input.totalCount === "number" ? input.totalCount : 12,
    customer_notify: input.customerNotify ?? 1,
    notes: input.notes,
  });
  return { id: subscription.id, status: subscription.status, shortUrl: subscription.short_url };
}

export async function fetchRazorpaySubscription(subscriptionId: string): Promise<any> {
  const razorpay = getRazorpayInstance();
  return await (razorpay as any).subscriptions.fetch(subscriptionId);
}

export function verifyRazorpaySubscriptionSignature(input: {
  razorpaySubscriptionId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error("Razorpay key secret not configured");
  }

  const body = `${input.razorpayPaymentId}|${input.razorpaySubscriptionId}`;
  const expected = crypto.createHmac("sha256", keySecret).update(body).digest("hex");
  return expected === input.razorpaySignature;
}

export function verifyRazorpayWebhookSignature(input: {
  rawBody: Buffer | string;
  signature: string;
  webhookSecret?: string;
}): boolean {
  const secret = input.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("Razorpay webhook secret not configured");
  const payload = Buffer.isBuffer(input.rawBody) ? input.rawBody : Buffer.from(String(input.rawBody), "utf8");
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return expected === input.signature;
}

