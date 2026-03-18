import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { CustomerSubscription, DeliverySubscription, SellerSubscription } from "../../../models";

type SubType = "Seller" | "Customer" | "DeliveryPartner";

const parsePositiveInt = (value: any, fallback: number) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return i > 0 ? i : fallback;
};

const pickPlanName = (doc: any): string | undefined => {
  const fromNotes = doc?.razorpaySubscriptionObject?.notes?.planName;
  if (typeof fromNotes === "string" && fromNotes.trim()) return fromNotes.trim();
  return undefined;
};

export const listAllSubscriptions = asyncHandler(async (req: Request, res: Response) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = Math.min(parsePositiveInt(req.query.limit, 50), 200);
  const skip = (page - 1) * limit;
  const type = req.query.type ? String(req.query.type) : "all";

  const wantsSeller = type === "all" || type === "Seller";
  const wantsCustomer = type === "all" || type === "Customer";
  const wantsDelivery = type === "all" || type === "DeliveryPartner";

  const [seller, customer, delivery] = await Promise.all([
    wantsSeller
      ? SellerSubscription.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
      : Promise.resolve([]),
    wantsCustomer
      ? CustomerSubscription.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
      : Promise.resolve([]),
    wantsDelivery
      ? DeliverySubscription.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
      : Promise.resolve([]),
  ]);

  const normalize = (subType: SubType, doc: any) => ({
    subType,
    _id: doc._id,
    planId: doc.planId,
    status: doc.status,
    startsAt: doc.startsAt,
    endsAt: doc.endsAt,
    razorpayPlanId: doc.razorpayPlanId,
    razorpaySubscriptionId: doc.razorpaySubscriptionId,
    planName: pickPlanName(doc),
    userId: subType === "Seller" ? doc.sellerId : subType === "Customer" ? doc.customerId : doc.deliveryId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });

  const data = [
    ...seller.map((d) => normalize("Seller", d)),
    ...customer.map((d) => normalize("Customer", d)),
    ...delivery.map((d) => normalize("DeliveryPartner", d)),
  ].sort((a, b) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bt - at;
  });

  return res.status(200).json({
    success: true,
    message: "Subscriptions fetched successfully",
    data,
    meta: {
      page,
      limit,
      type,
      returned: data.length,
    },
  });
});

