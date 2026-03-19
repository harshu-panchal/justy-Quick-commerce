import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyReferralStats,
  applyReferralCode,
  type ReferralStats,
} from "../../services/api/customerReferralService";

export default function CustomerReferEarn() {
  const navigate = useNavigate();
  const [loading,   setLoading]   = useState(false);
  const [stats,     setStats]     = useState<ReferralStats | null>(null);
  const [error,     setError]     = useState("");
  const [applyCode, setApplyCode] = useState("");
  const [applying,  setApplying]  = useState(false);
  const [applyMsg,  setApplyMsg]  = useState("");
  const [applyErr,  setApplyErr]  = useState("");
  const [copied,    setCopied]    = useState(false);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await getMyReferralStats();
      if (res.success) setStats(res.data);
      else setError("Failed to load referral data");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const copyCode = () => {
    if (!stats?.referralCode) return;
    navigator.clipboard.writeText(stats.referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareCode = () => {
    if (!stats?.referralCode) return;
    const text = `Join using my referral code ${stats.referralCode} and earn coins! 🎁`;
    if (navigator.share) {
      navigator.share({ title: "Join & Earn Coins", text });
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApply = async () => {
    if (!applyCode.trim()) return;
    setApplying(true); setApplyMsg(""); setApplyErr("");
    try {
      const res = await applyReferralCode(applyCode.trim().toUpperCase());
      if (res.success) {
        setApplyMsg(res.message || "Referral code applied!");
        setApplyCode("");
        load();
      } else {
        setApplyErr(res.message || "Failed to apply code");
      }
    } catch (e: any) {
      setApplyErr(e?.response?.data?.message || e?.message || "Failed to apply");
    } finally { setApplying(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 p-4 sm:p-6">
      <div className="max-w-md mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-extrabold text-teal-900">🎁 Refer &amp; Earn</h1>
            <p className="text-xs text-teal-700 mt-0.5">Invite friends, earn coins together!</p>
          </div>
          <button onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-600 hover:bg-neutral-50 shadow-sm">
            ← Back
          </button>
        </div>

        {error && <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">⚠️ {error}</div>}

        {loading && !stats ? (
          <div className="rounded-3xl bg-white border border-neutral-200 shadow p-10 text-center text-neutral-400 animate-pulse">
            Loading your referral data…
          </div>
        ) : stats ? (
          <>
            {/* Earnings summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-4 text-white shadow-lg">
                <div className="text-3xl font-black">{stats.referralEarnings}</div>
                <div className="text-xs font-semibold opacity-90 mt-1">🪙 Coins Earned</div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white shadow-lg">
                <div className="text-3xl font-black">{stats.referralCount}</div>
                <div className="text-xs font-semibold opacity-90 mt-1">👥 Friends Referred</div>
              </div>
            </div>

            {/* My referral code */}
            <div className="rounded-3xl bg-white border-2 border-teal-300 shadow-xl p-5">
              <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-3">
                🔗 Your Referral Code
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-2xl px-5 py-3 text-center">
                  <span className="text-3xl font-black tracking-widest text-teal-800 font-mono">
                    {stats.referralCode}
                  </span>
                </div>
                <button onClick={copyCode}
                  className={`px-4 py-3 rounded-2xl font-bold text-sm shadow transition-all active:scale-95 ${
                    copied
                      ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300"
                      : "bg-teal-600 text-white hover:bg-teal-700"
                  }`}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
              <button onClick={shareCode}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-extrabold text-sm shadow hover:opacity-90 active:scale-[0.98] transition-all">
                📤 Share & Earn Coins
              </button>

              {/* How it works */}
              <div className="mt-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 space-y-2">
                <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">How it works</div>
                <div className="flex items-start gap-2 text-xs text-blue-800">
                  <span className="text-base">1️⃣</span>
                  <span>Share your code with a friend</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-blue-800">
                  <span className="text-base">2️⃣</span>
                  <span>Friend signs up &amp; applies your code</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-blue-800">
                  <span className="text-base">3️⃣</span>
                  <span>Friend places their qualifying order</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-blue-800">
                  <span className="text-base">4️⃣</span>
                  <span className="font-bold">You earn coins in your wallet! 🎉</span>
                </div>
              </div>
            </div>

            {/* Apply referral code */}
            {!stats.isReferralApplied ? (
              <div className="rounded-3xl bg-white border border-neutral-200 shadow-sm p-5">
                <div className="text-sm font-bold text-neutral-800 mb-1">Have a referral code?</div>
                <p className="text-xs text-neutral-500 mb-3">
                  Enter a friend's code to link your accounts. Reward is credited after your first qualifying order.
                </p>
                {applyMsg && <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 font-medium">✅ {applyMsg}</div>}
                {applyErr && <div className="mb-3 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">⚠️ {applyErr}</div>}
                <div className="flex gap-2">
                  <input
                    value={applyCode}
                    onChange={e => { setApplyCode(e.target.value.toUpperCase()); setApplyErr(""); }}
                    placeholder="Enter referral code"
                    maxLength={10}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-mono font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <button onClick={handleApply} disabled={applying || !applyCode.trim()}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 disabled:opacity-50 active:scale-95 transition-all">
                    {applying ? "…" : "Apply"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="text-sm font-bold text-emerald-800">Referral code applied!</div>
                  {stats.appliedCode && (
                    <div className="text-xs text-emerald-600 mt-0.5">
                      You signed up using code <span className="font-bold font-mono">{stats.appliedCode}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Referred users list */}
            {stats.referredUsers.length > 0 && (
              <div className="rounded-3xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-100">
                  <div className="text-sm font-bold text-neutral-900">👥 Friends You Referred</div>
                </div>
                <div className="divide-y divide-neutral-100">
                  {stats.referredUsers.map((u, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="text-sm font-semibold text-neutral-800">{u.name}</div>
                        <div className="text-xs text-neutral-400">
                          {new Date(u.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        u.isCompleted
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {u.isCompleted ? "✅ Reward earned" : "⏳ Pending order"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
