import React, { useEffect, useState } from "react";
import {
  getReferralSettings,
  updateReferralSettings,
  getAdminReferralStats,
  type ReferralSettings,
  type AdminReferralStats,
} from "../../../services/api/admin/adminReferralService";

export default function AdminReferEarn() {
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [stats,    setStats]    = useState<AdminReferralStats | null>(null);

  const [form, setForm] = useState<ReferralSettings>({
    enabled: false,
    rewardAmount: 50,
    rewardType: "Wallet",
    minOrderValue: 200,
    maxReferralsPerUser: 100,
  });

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [cfgRes, statsRes] = await Promise.all([
        getReferralSettings(),
        getAdminReferralStats(),
      ]);
      if (cfgRes.success) setForm(cfgRes.data);
      if (statsRes.success) setStats(statsRes.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await updateReferralSettings(form);
      if (res.success) setSuccess("Referral settings saved successfully!");
      else setError(res.message || "Failed to save");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">🎁 Refer &amp; Earn</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Configure referral rewards. When a referred customer places their first qualifying order, the referrer gets coins.
            </p>
          </div>
          <button type="button" onClick={load} disabled={loading}
            className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium hover:bg-neutral-50 disabled:opacity-50">
            {loading ? "Loading…" : "↺ Refresh"}
          </button>
        </div>

        {error   && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">⚠️ {error}</div>}
        {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-sm">✅ {success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Settings ── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-900">Configuration</div>
                <div
                  onClick={() => setForm(p => ({ ...p, enabled: !p.enabled }))}
                  className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors ${form.enabled ? "bg-teal-600" : "bg-neutral-300"}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.enabled ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </div>

              <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg text-center ${form.enabled ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                {form.enabled ? "● Referral program is ACTIVE" : "○ Referral program is INACTIVE"}
              </div>

              {/* Min order value */}
              <div>
                <label className="text-xs font-semibold text-neutral-600">Minimum Order Amount (₹)</label>
                <p className="text-[11px] text-neutral-400 mb-1">Referred customer must spend at least this much</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-bold">₹</span>
                  <input
                    type="number" min={1} value={form.minOrderValue}
                    onChange={e => setForm(p => ({ ...p, minOrderValue: Number(e.target.value) }))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              {/* Coins reward */}
              <div>
                <label className="text-xs font-semibold text-neutral-600">Coins to Referrer</label>
                <p className="text-[11px] text-neutral-400 mb-1">Coins credited to referrer when condition is met</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🪙</span>
                  <input
                    type="number" min={1} value={form.rewardAmount}
                    onChange={e => setForm(p => ({ ...p, rewardAmount: Number(e.target.value) }))}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              {/* Max referrals */}
              <div>
                <label className="text-xs font-semibold text-neutral-600">Max Referrals Per User</label>
                <p className="text-[11px] text-neutral-400 mb-1">A customer can refer up to this many people</p>
                <input
                  type="number" min={1} value={form.maxReferralsPerUser}
                  onChange={e => setForm(p => ({ ...p, maxReferralsPerUser: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {/* Summary card */}
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 space-y-1">
                <div className="font-bold text-sm">📋 How it works</div>
                <div>1️⃣ Customer A shares their referral code</div>
                <div>2️⃣ Customer B signs up &amp; applies the code</div>
                <div>3️⃣ Customer B places ₹{form.minOrderValue}+ order</div>
                <div>4️⃣ Customer A gets 🪙 {form.rewardAmount} coins</div>
              </div>

              <button type="button" onClick={save} disabled={saving || loading}
                className="w-full px-4 py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 active:scale-[0.98] transition-all">
                {saving ? "⏳ Saving…" : "💾 Save Settings"}
              </button>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Overview cards */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Referrals", value: stats.totalReferrals, icon: "🔗", color: "bg-blue-50 border-blue-200 text-blue-900" },
                  { label: "Total Referrers", value: stats.totalReferrers, icon: "👥", color: "bg-purple-50 border-purple-200 text-purple-900" },
                  { label: "Total Referred", value: stats.totalReferred, icon: "🆕", color: "bg-orange-50 border-orange-200 text-orange-900" },
                  { label: "Coins Awarded", value: stats.totalCoinsAwarded, icon: "🪙", color: "bg-amber-50 border-amber-200 text-amber-900" },
                ].map(card => (
                  <div key={card.label} className={`rounded-2xl border p-4 ${card.color}`}>
                    <div className="text-2xl">{card.icon}</div>
                    <div className="text-xl font-extrabold mt-1">{card.value.toLocaleString()}</div>
                    <div className="text-xs font-semibold mt-0.5 opacity-70">{card.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Top Referrers table */}
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-900">🏆 Top Referrers</div>
                <div className="text-xs text-neutral-400">{stats?.topReferrers.length ?? 0} users</div>
              </div>

              {loading ? (
                <div className="p-10 text-center text-neutral-400 text-sm animate-pulse">Loading…</div>
              ) : !stats || stats.topReferrers.length === 0 ? (
                <div className="p-10 text-center text-neutral-400 text-sm">
                  <div className="text-4xl mb-2">🔗</div>
                  No referrals yet. Enable the program and share codes!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-50 text-xs text-neutral-500 uppercase tracking-wide">
                        <th className="px-5 py-3 text-left">#</th>
                        <th className="px-5 py-3 text-left">Customer</th>
                        <th className="px-5 py-3 text-left">Ref Code</th>
                        <th className="px-5 py-3 text-center">Referrals</th>
                        <th className="px-5 py-3 text-center">Coins Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topReferrers.map((r, i) => (
                        <tr key={r._id} className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors">
                          <td className="px-5 py-3 text-neutral-400 font-mono text-xs">{i + 1}</td>
                          <td className="px-5 py-3">
                            <div className="font-semibold text-neutral-900">{r.name}</div>
                            <div className="text-xs text-neutral-400">{r.phone}</div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-block bg-teal-100 text-teal-800 font-bold text-xs px-2.5 py-1 rounded-lg tracking-widest">
                              {r.refCode}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="font-bold text-blue-700">{r.referralCount}</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                              🪙 {r.referralEarnings}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
