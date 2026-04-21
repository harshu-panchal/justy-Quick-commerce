import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyReferralStats,
  applyReferralCode,
  type ReferralStats,
} from "../../services/api/customerReferralService";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";

export default function CustomerReferEarn() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [error, setError] = useState("");
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");
  const [applyErr, setApplyErr] = useState("");
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyReferralStats();
      if (res.success) setStats(res.data);
      else setError("Failed to load referral data");
    } catch (e: any) {
      if (e?.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else {
        setError(e?.response?.data?.message || e?.message || "Failed to load");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      load();
    }
  }, [isAuthenticated]);

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
    setApplying(true);
    setApplyMsg("");
    setApplyErr("");
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
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 selection:bg-teal-500/10">
      {/* ── Floating Header ── */}
      <div className="bg-gradient-to-br from-teal-600 to-emerald-600 rounded-b-[40px] shadow-lg relative pb-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between px-4 py-4 pt-6 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
            Refer & Earn
          </div>
        </div>

        <div className="px-8 pb-4 text-white relative z-10">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-black mb-1 drop-shadow-sm"
          >
            Gift a Friend 🎁
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xs text-emerald-100 font-medium opacity-90 max-w-[240px]"
          >
            Invite friends to Justy and get exclusive coin rewards on their first order.
          </motion.p>
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-20 space-y-5">
        {/* Messages */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 text-red-800 text-xs font-bold p-3 rounded-2xl shadow-sm text-center">
            ⚠️ {error}
          </motion.div>
        )}

        {!isAuthenticated ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[40px] p-8 text-center shadow-xl border border-neutral-100">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-xl font-black text-neutral-900 mb-2">Ready to Earn?</h2>
            <p className="text-sm text-neutral-500 mb-8 leading-relaxed">Join our community to start earning coins by referring your friends!</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-4 rounded-3xl bg-teal-600 text-white font-black text-sm shadow-lg shadow-teal-100 active:scale-95 transition-all"
            >
              Log In to Continue
            </button>
          </motion.div>
        ) : loading && !stats ? (
          <div className="bg-white rounded-[32px] p-12 text-center border border-neutral-100 shadow-sm">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Loading Rewards...</p>
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-neutral-100 relative overflow-hidden group min-w-0">
                <div className="absolute top-0 right-0 p-2 bg-amber-50 rounded-bl-2xl text-xs sm:text-sm">🪙</div>
                <div className="text-xl sm:text-2xl font-black text-neutral-900 truncate">{stats.referralEarnings}</div>
                <div className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider mt-1">Total Earned</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-neutral-100 relative overflow-hidden min-w-0">
                <div className="absolute top-0 right-0 p-2 bg-emerald-50 rounded-bl-2xl text-xs sm:text-sm">👥</div>
                <div className="text-xl sm:text-2xl font-black text-neutral-900 truncate">{stats.referralCount}</div>
                <div className="text-[9px] sm:text-[10px] font-black text-neutral-400 uppercase tracking-wider mt-1">Total Referrals</div>
              </motion.div>
            </div>

            {/* Referral Code Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-[32px] p-4 sm:p-6 shadow-xl border-2 border-teal-500 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-50 rounded-full blur-2xl" />
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-4">Your Invitation Code</p>
              
              <div className="flex items-center gap-2 sm:gap-3 mb-5">
                <div className="flex-1 min-w-0 bg-neutral-50 rounded-2xl px-4 sm:px-6 py-4 text-center border border-neutral-100 group">
                  <span className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-[0.2em] font-mono block truncate">{stats.referralCode}</span>
                </div>
                <button 
                  onClick={copyCode}
                  className={`px-4 sm:px-6 py-4 rounded-2xl font-black text-[10px] sm:text-xs transition-all active:scale-95 shadow-md shrink-0 whitespace-nowrap ${
                    copied ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-neutral-900 text-white"
                  }`}
                >
                  {copied ? "COPIED" : "COPY"}
                </button>
              </div>

              <button 
                onClick={shareCode}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-black text-sm shadow-lg shadow-teal-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>🚀</span> Share Invitation
              </button>
            </motion.div>

            {/* How it works Banner */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-neutral-900 rounded-[32px] p-6 text-white overflow-hidden relative">
              <div className="absolute bottom-0 right-0 opacity-20 translate-x-1/4 translate-y-1/4">
                 <span className="text-9xl">✨</span>
              </div>
              <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-4">How it works</p>
              <div className="space-y-4">
                {[
                  { n: "1", t: "Send Invite", d: "Share code with your friends" },
                  { n: "2", t: "Friend Orders", d: "They place their first order" },
                  { n: "3", t: "Collect Coins", d: "You get rewards in your wallet" }
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-black text-xs shrink-0">{step.n}</div>
                    <div>
                      <h4 className="text-xs font-bold">{step.t}</h4>
                      <p className="text-[10px] text-neutral-400">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Apply Code Input */}
            {!stats.isReferralApplied ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-[32px] p-5 sm:p-6 shadow-sm border border-neutral-100">
                <h3 className="text-sm font-black text-neutral-900 mb-1">Invited by a friend?</h3>
                <p className="text-[10px] text-neutral-400 mb-4 font-medium uppercase tracking-wider">Enter their code below</p>
                
                {applyMsg && <div className="mb-4 bg-emerald-50 text-emerald-700 text-[10px] font-bold p-3 rounded-xl border border-emerald-100 uppercase tracking-wider text-center">✅ {applyMsg}</div>}
                {applyErr && <div className="mb-4 bg-red-50 text-red-600 text-[10px] font-bold p-3 rounded-xl border border-red-100 uppercase tracking-wider text-center">⚠️ {applyErr}</div>}
                
                <div className="flex gap-2">
                  <input
                    value={applyCode}
                    onChange={e => { setApplyCode(e.target.value.toUpperCase()); setApplyErr(""); }}
                    placeholder="FRIENDCODE"
                    className="flex-1 min-w-0 bg-neutral-50 px-4 sm:px-5 py-3.5 rounded-2xl text-sm font-black tracking-widest placeholder:text-neutral-300 focus:outline-none border border-neutral-100"
                  />
                  <button 
                    onClick={handleApply} 
                    disabled={applying || !applyCode.trim()}
                    className="px-4 sm:px-6 py-3.5 rounded-2xl bg-teal-600 text-white font-black text-[10px] sm:text-xs shadow-md active:scale-95 disabled:opacity-50 transition-all shrink-0 whitespace-nowrap"
                  >
                    {applying ? "..." : "APPLY"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-xl">✨</div>
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Invite Success</p>
                  <p className="text-xs font-bold text-emerald-800">Linked to <span className="font-mono text-neutral-900 uppercase">{stats.appliedCode}</span></p>
                </div>
              </div>
            )}

            {/* Referrals List */}
            {stats.referredUsers.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-neutral-100">
                <div className="px-6 py-5 border-b border-neutral-50 bg-neutral-50/50">
                  <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest">Recent Activity</h3>
                </div>
                <div className="divide-y divide-neutral-50">
                  {stats.referredUsers.map((u, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-xs text-neutral-500">{u.name.charAt(0)}</div>
                        <div>
                          <div className="text-xs font-black text-neutral-900">{u.name}</div>
                          <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">{new Date(u.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${
                        u.isCompleted ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        {u.isCompleted ? "Earned" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        ) : null}
      </div>
      
      <div className="text-center pt-10 pb-10 opacity-30">
         <p className="text-[10px] font-black uppercase tracking-widest">Justy Referral Program • v2.0</p>
      </div>
    </div>
  );
}
