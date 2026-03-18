import React, { useEffect, useMemo, useState } from "react";
import { createDeliverySubscription, getDeliveryPlans, getMyActiveDeliverySubscription, type DeliveryPlan, type DeliverySubscription } from "../../../services/api/deliveryPlanService";
import { useAuth } from "../../../context/AuthContext";
import DeliveryHeader from "../components/DeliveryHeader";
import DeliveryBottomNav from "../components/DeliveryBottomNav";

export default function DeliveryPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<DeliveryPlan[]>([]);
  const [activeSub, setActiveSub] = useState<DeliverySubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyPlanId, setBusyPlanId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [info, setInfo] = useState<string>("");

  const deliveryName = useMemo(() => {
    return (user as any)?.name || (user as any)?.deliveryBoyName || "Delivery Partner";
  }, [user]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [plansRes, subRes] = await Promise.all([getDeliveryPlans(), getMyActiveDeliverySubscription()]);
      if (plansRes.success) setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
      else setError(plansRes.message || "Failed to load plans");

      if (subRes.success) setActiveSub(subRes.data);
      else setActiveSub(null);

      if (subRes.success && subRes.data?.status === "active") {
        setInfo("You already have an active subscription. Upgrade/downgrade is not allowed.");
      } else {
        setInfo("");
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activePlanId = useMemo(() => {
    if (!activeSub || activeSub.status !== "active") return "";
    const p: any = activeSub.planId;
    return typeof p === "object" && p?._id ? String(p._id) : "";
  }, [activeSub]);

  const activePlanName = useMemo(() => {
    if (!activeSub || activeSub.status !== "active") return "";
    const p: any = activeSub.planId;
    return typeof p === "object" && p?.name ? String(p.name) : "";
  }, [activeSub]);

  const startCheckout = async (plan: DeliveryPlan) => {
    setError("");
    setSuccess("");
    setInfo("");

    if (activeSub?.status === "active") {
      setInfo("You already have an active subscription. Upgrade/downgrade is not allowed.");
      return;
    }

    setBusyPlanId(plan._id);
    try {
      const subRes = await createDeliverySubscription(plan._id);
      if (!subRes.success || !subRes.data?.subscriptionId) {
        throw new Error(subRes.message || "Failed to create subscription");
      }
      const url = subRes.data.shortUrl;
      if (!url) throw new Error("Razorpay subscription link not generated. Please contact support.");

      window.open(url, "_blank", "noopener,noreferrer");
      setSuccess("Razorpay subscription link opened. Complete payment to activate your subscription.");
    } catch (e: any) {
      setError(e?.message || "Failed to start checkout");
    } finally {
      setBusyPlanId("");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 pb-20">
      <DeliveryHeader />
      <div className="px-4 py-4 max-w-7xl mx-auto space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-neutral-900 text-xl font-semibold">Plans</h2>
            <p className="text-sm text-neutral-600 mt-1">Choose a subscription plan.</p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">{error}</div> : null}
        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-sm">{success}</div>
        ) : null}
        {info ? <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800 text-sm">{info}</div> : null}

        {activeSub?.status === "active" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-semibold text-emerald-900">Active subscription</div>
                <div className="text-sm text-emerald-800 mt-1">
                  {activePlanName ? (
                    <>
                      Plan: <span className="font-semibold">{activePlanName}</span>
                    </>
                  ) : (
                    <>Plan: <span className="font-semibold">Active</span></>
                  )}
                </div>
                <div className="text-xs text-emerald-700 mt-1">
                  {activeSub.startsAt ? `Start: ${new Date(activeSub.startsAt).toLocaleString()}` : null}
                  {activeSub.endsAt ? ` • End: ${new Date(activeSub.endsAt).toLocaleString()}` : null}
                </div>
              </div>
              <div className="text-xs text-emerald-800">
                Subscription ID: <span className="font-mono">{activeSub.razorpaySubscriptionId}</span>
              </div>
            </div>
          </div>
        ) : null}

        {plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-600">
            {loading ? "Loading plans…" : "No active plans available."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div
                key={p._id}
                className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${
                  activePlanId && activePlanId === p._id ? "border-emerald-300 ring-2 ring-emerald-200" : "border-neutral-200"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">{p.name}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{p.period}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-neutral-900">₹{Number(p.amount || 0).toFixed(0)}</div>
                      <div className="text-xs text-neutral-500">per {p.period}</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 min-h-[84px]">
                    {Array.isArray(p.points) && p.points.length ? (
                      p.points.slice(0, 5).map((pt, idx) => (
                        <div key={idx} className="text-xs text-neutral-700 flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                          <span className="line-clamp-1">{pt}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-neutral-400">No details</div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => startCheckout(p)}
                    disabled={Boolean(busyPlanId) || activeSub?.status === "active"}
                    className="mt-4 w-full px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
                  >
                    {activePlanId && activePlanId === p._id
                      ? "Current plan"
                      : activeSub?.status === "active"
                        ? "Not available"
                        : busyPlanId === p._id
                          ? "Opening Razorpay…"
                          : "Buy subscription"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-neutral-500">
          Logged in as <span className="font-medium">{deliveryName}</span>
        </div>
      </div>
      <DeliveryBottomNav />
    </div>
  );
}

