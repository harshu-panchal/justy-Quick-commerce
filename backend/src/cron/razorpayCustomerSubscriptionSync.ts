import CustomerSubscription from "../models/CustomerSubscription";
import { fetchRazorpaySubscription } from "../services/razorpaySubscriptionService";

function unixToDate(v: any): Date | undefined {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return new Date(n * 1000);
}

export async function syncRazorpayCustomerSubscriptionsOnce(opts?: { limit?: number }) {
  const limit = opts?.limit ?? 25;

  const subs = await CustomerSubscription.find({
    status: { $in: ["created", "authenticated", "pending", "halted"] },
  })
    .sort({ updatedAt: 1 })
    .limit(limit);

  let checked = 0;
  let updated = 0;
  let errors = 0;

  for (const s of subs) {
    checked += 1;
    try {
      const rp = await fetchRazorpaySubscription(s.razorpaySubscriptionId);
      const status = String(rp?.status || s.status);
      const startsAt = unixToDate(rp?.current_start);
      const endsAt = unixToDate(rp?.current_end);

      (s as any).razorpaySubscriptionObject = rp;

      if (status && status !== s.status) (s as any).status = status;
      if (startsAt && (!s.startsAt || s.startsAt.getTime() !== startsAt.getTime())) s.startsAt = startsAt;
      if (endsAt && (!s.endsAt || s.endsAt.getTime() !== endsAt.getTime())) s.endsAt = endsAt;

      await s.save();
      updated += 1;
    } catch {
      errors += 1;
    }
  }

  return { checked, updated, errors };
}

