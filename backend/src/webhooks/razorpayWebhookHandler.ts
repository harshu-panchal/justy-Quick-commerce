import SellerSubscription from "../models/SellerSubscription";
import CustomerSubscription from "../models/CustomerSubscription";
import DeliverySubscription from "../models/DeliverySubscription";
import { verifyRazorpayWebhookSignature } from "../services/razorpaySubscriptionService";

function unixToDate(v: any): Date | undefined {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return new Date(n * 1000);
}

function mapStatus(s: any): any {
  const status = String(s || "").toLowerCase();
  switch (status) {
    case "created":
    case "authenticated":
    case "active":
    case "pending":
    case "halted":
    case "cancelled":
    case "completed":
    case "expired":
      return status;
    default:
      return undefined;
  }
}

export async function handleRazorpayWebhook(input: {
  rawBody: Buffer;
  signature: string;
}): Promise<{ ok: boolean; message: string }> {
  if (!input.signature) return { ok: false, message: "Missing signature" };

  const valid = verifyRazorpayWebhookSignature({
    rawBody: input.rawBody,
    signature: input.signature,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  });
  if (!valid) return { ok: false, message: "Invalid signature" };

  let body: any;
  try {
    body = JSON.parse(input.rawBody.toString("utf8"));
  } catch {
    return { ok: false, message: "Invalid JSON body" };
  }

  const event = String(body?.event || "");
  const receivedAt = new Date();
  const webhookEventDoc = { receivedAt, event, payload: body };

  // Subscription events: subscription.* (activated, charged, cancelled, completed, halted, pending, paused, resumed, etc.)
  if (event.startsWith("subscription.")) {
    const sub = body?.payload?.subscription?.entity;
    const subscriptionId = sub?.id;
    if (!subscriptionId) return { ok: true, message: "No subscription entity" };

    const status = mapStatus(sub?.status);
    const startsAt = unixToDate(sub?.current_start);
    const endsAt = unixToDate(sub?.current_end);

    const update = {
      ...(status ? { status } : {}),
      ...(startsAt ? { startsAt } : {}),
      ...(endsAt ? { endsAt } : {}),
      razorpaySubscriptionObject: sub,
      $push: { webhookEvents: { $each: [webhookEventDoc], $slice: -50 } },
    };

    // Update whichever collection contains this subscription
    await Promise.all([
      SellerSubscription.findOneAndUpdate({ razorpaySubscriptionId: String(subscriptionId) }, update, { new: true }),
      CustomerSubscription.findOneAndUpdate({ razorpaySubscriptionId: String(subscriptionId) }, update, { new: true }),
      DeliverySubscription.findOneAndUpdate({ razorpaySubscriptionId: String(subscriptionId) }, update, { new: true }),
    ]);

    return { ok: true, message: "Subscription webhook processed" };
  }

  // Payment events sometimes include subscription_id (recurring charge)
  if (event === "payment.captured" || event === "payment.authorized") {
    const payment = body?.payload?.payment?.entity;
    const subscriptionId = payment?.subscription_id;
    if (subscriptionId) {
      const update = {
        razorpayPaymentId: String(payment?.id || ""),
        razorpayLastPaymentObject: payment,
        $push: { webhookEvents: { $each: [webhookEventDoc], $slice: -50 } },
      };
      await Promise.all([
        SellerSubscription.findOneAndUpdate({ razorpaySubscriptionId: String(subscriptionId) }, update, { new: true }),
        CustomerSubscription.findOneAndUpdate({ razorpaySubscriptionId: String(subscriptionId) }, update, { new: true }),
        DeliverySubscription.findOneAndUpdate({ razorpaySubscriptionId: String(subscriptionId) }, update, { new: true }),
      ]);
    }
    return { ok: true, message: "Payment webhook processed" };
  }

  return { ok: true, message: "Event ignored" };
}

