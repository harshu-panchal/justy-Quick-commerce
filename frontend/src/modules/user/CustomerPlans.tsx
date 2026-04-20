import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  createCustomerSubscription,
  getCustomerPlans,
  getMyActiveCustomerSubscription,
  type CustomerPlan,
  type CustomerSubscription,
} from "../../services/api/customerPlanService";
import { useAuth } from "../../context/AuthContext";

export default function CustomerPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<CustomerPlan[]>([]);
  const [activeSub, setActiveSub] = useState<CustomerSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyPlanId, setBusyPlanId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [info, setInfo] = useState<string>("");

  const customerName = useMemo(() => {
    return (user as any)?.name || (user as any)?.customerName || "Customer";
  }, [user]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [plansRes, subRes] = await Promise.all([getCustomerPlans(), getMyActiveCustomerSubscription()]);
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

  const startCheckout = async (plan: CustomerPlan) => {
    setError("");
    setSuccess("");
    setInfo("");

    if (activeSub?.status === "active") {
      setInfo("You already have an active subscription. Upgrade/downgrade is not allowed.");
      return;
    }

    setBusyPlanId(plan._id);
    try {
      const subRes = await createCustomerSubscription(plan._id);
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

  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-neutral-50 pb-32">
      {/* ── Floating Header ── */}
      <div className="bg-gradient-to-br from-teal-600 to-emerald-600 rounded-b-3xl shadow-lg relative pb-10">
        <div className="flex items-center justify-between px-4 py-4 pt-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors disabled:opacity-50"
            aria-label="Refresh plans"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
        <div className="px-6 pb-2 text-white">
          <h1 className="text-2xl font-black mb-1">Premium Plans 👑</h1>
          <p className="text-xs text-emerald-100 font-medium opacity-90">Unlock exclusive benefits & priority support.</p>
        </div>
      </div>

      <div className="px-5 -mt-6 relative z-10 space-y-4">
        {/* Messages */}
        {error && <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="bg-red-50 border border-red-200 text-red-800 text-xs font-bold p-3 rounded-2xl shadow-sm">{error}</motion.div>}
        {success && <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-2xl shadow-sm">{success}</motion.div>}
        {info && <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold p-3 rounded-2xl shadow-sm">{info}</motion.div>}

        {/* Active Subscription Banner */}
        {activeSub?.status === "active" && (
          <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-white rounded-2xl p-4 shadow-sm border-2 border-emerald-400">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Plan</p>
                <h3 className="text-sm font-bold text-neutral-900">{activePlanName || 'Premium Active'}</h3>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-neutral-500 bg-neutral-50 p-2 rounded-xl">
              <div className="flex justify-between mb-1">
                <span>Starts: <span className="font-semibold text-neutral-700">{activeSub.startsAt ? new Date(activeSub.startsAt).toLocaleDateString() : 'N/A'}</span></span>
                <span>Ends: <span className="font-semibold text-neutral-700">{activeSub.endsAt ? new Date(activeSub.endsAt).toLocaleDateString() : 'N/A'}</span></span>
              </div>
              <p className="text-[9px] text-neutral-400 font-mono mt-1">ID: {activeSub.razorpaySubscriptionId}</p>
            </div>
          </motion.div>
        )}

        {/* Plans Grid */}
        {plans.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-neutral-100 shadow-sm mt-4">
            <span className="text-4xl mb-2 block">⏳</span>
            <p className="text-sm font-bold text-neutral-800">{loading ? "Loading plans…" : "No plans available right now."}</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {plans.map((p, idx) => {
              const isActive = activePlanId && activePlanId === p._id;
              return (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative overflow-hidden bg-white rounded-3xl shadow-sm border ${isActive ? "border-emerald-500 shadow-emerald-100" : "border-neutral-100"}`}
                >
                  {isActive && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl z-20">
                      Current
                    </div>
                  )}
                  {/* Card Header Background */}
                  <div className="bg-neutral-50 px-5 py-4 border-b border-neutral-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-black text-neutral-900">{p.name}</h3>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{p.period}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-emerald-600">₹{Number(p.amount || 0).toFixed(0)}</span>
                        <p className="text-[10px] text-neutral-400">/ {p.period}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <p className="text-[10px] font-bold text-neutral-400 mb-3 uppercase tracking-wider">Features Included</p>
                    <div className="space-y-2.5 mb-5 min-h-[80px]">
                      {Array.isArray(p.points) && p.points.length ? (
                        p.points.map((pt, i) => (
                          <div key={i} className="flex gap-2.5 items-start">
                            <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-emerald-600"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            <span className="text-xs text-neutral-700 font-medium leading-tight pt-0.5">{pt}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-400 italic">Core features loaded.</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => startCheckout(p)}
                      disabled={Boolean(busyPlanId) || activeSub?.status === "active"}
                      className={`w-full py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 shadow-md ${
                        isActive
                          ? "bg-emerald-50 text-emerald-600 border-2 border-emerald-200 cursor-not-allowed shadow-none"
                          : activeSub?.status === "active"
                            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none"
                            : "bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-200"
                      }`}
                    >
                      {isActive
                        ? "Current Plan"
                        : activeSub?.status === "active"
                          ? "Upgrade Unavailable"
                          : busyPlanId === p._id
                            ? "Processing…"
                            : "Choose Plan"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="text-center pt-4 opacity-50">
          <p className="text-[10px] text-neutral-500 font-medium">Logged in as {customerName}</p>
        </div>
      </div>
    </div>
  );
}
