import SellerSubscription from "../models/SellerSubscription";
import { fetchRazorpaySubscription } from "../services/razorpaySubscriptionService";

function unixToDate(v: any): Date | undefined {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return new Date(n * 1000);
}

export async function syncRazorpaySubscriptionsOnce(opts?: { limit?: number }) {
  const limit = opts?.limit ?? 25;

  const subs = await SellerSubscription.find({
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

      let changed = false;
      // Store full Razorpay object snapshot
      (s as any).razorpaySubscriptionObject = rp;
      changed = true;
      if (status && status !== s.status) {
        (s as any).status = status;
      }
      if (startsAt && (!s.startsAt || s.startsAt.getTime() !== startsAt.getTime())) {
        s.startsAt = startsAt;
      }
      if (endsAt && (!s.endsAt || s.endsAt.getTime() !== endsAt.getTime())) {
        s.endsAt = endsAt;
      }

      if (changed) {
        await s.save();
        updated += 1;
      }
    } catch (e) {
      // ignore single subscription failure; cron will retry later
      errors += 1;
    }
  }

  return { checked, updated, errors };
}

