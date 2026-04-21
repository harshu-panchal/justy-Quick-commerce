import React, { useEffect, useMemo, useRef, useState } from "react";
import { getSpinWheelCampaign, spinNow, getCustomerCoinBalance, convertCustomerCoins, type SpinAttempt, type SpinCampaign } from "../../services/api/customerSpinWheelService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

function getNextEligibleDate(mySpin: SpinAttempt | null): Date | null {
  const next = (mySpin as any)?.nextEligibleAt;
  const createdAt = mySpin?.createdAt;
  const base = next
    ? new Date(next)
    : createdAt
    ? new Date(new Date(createdAt).getTime() + 24 * 60 * 60 * 1000)
    : null;
  if (!base || Number.isNaN(base.getTime())) return null;
  return base;
}

function useCountdown(targetDate: Date | null): string {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!targetDate) { setRemaining(""); return; }
    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) { setRemaining("00:00:00"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return remaining;
}

interface Segment {
  type: "COINS" | "MEGA_REWARD";
  label: string;
  value: number;
  megaName?: string;
  megaImageUrl?: string;
}

const PREMIUM_COLORS = ["#0D9488", "#0F766E", "#14B8A6", "#0D9488", "#2DD4BF"];

function sliceColor(index: number, isMega: boolean) {
  if (isMega) return "#F59E0B";
  return PREMIUM_COLORS[index % PREMIUM_COLORS.length];
}

function pieSlice(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${endDeg - startDeg > 180 ? 1 : 0},1 ${x2},${y2} Z`;
}

function SpinWheelSVG({ segments, wheelRef, isSpinning }: { segments: Segment[]; wheelRef: React.RefObject<HTMLDivElement>; isSpinning: boolean }) {
  if (!segments.length) return null;
  const cx = 150, cy = 150, r = 138;
  const slice = 360 / segments.length;
  
  // LED Lights
  const ledCount = 24;
  const ledRadius = r + 15;
  const leds = Array.from({ length: ledCount }).map((_, i) => {
    const angle = (i * 360) / ledCount;
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + ledRadius * Math.cos(rad),
      y: cy + ledRadius * Math.sin(rad),
    };
  });

  return (
    <div ref={wheelRef} className="w-full h-full relative" style={{ transformOrigin: "center center" }}>
      <svg viewBox="-5 -5 310 310" className="w-full h-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
        <defs>
          <radialGradient id="wheelGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="70%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
          </radialGradient>
          <filter id="innerShadow">
            <feOffset dx="0" dy="1" />
            <feGaussianBlur stdDeviation="2" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.2" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Outer LED Ring Background */}
        <circle cx={cx} cy={cy} r={r + 20} fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
        
        {/* Lights */}
        {leds.map((led, i) => (
          <motion.circle
            key={i}
            cx={led.x}
            cy={led.y}
            r="3"
            initial={{ fill: "#cbd5e1" }}
            animate={isSpinning ? {
              fill: ["#14b8a6", "#cbd5e1", "#14b8a6"],
              opacity: [1, 0.4, 1],
              scale: [1, 1.2, 1],
            } : { fill: i % 2 === 0 ? "#14b8a6" : "#cbd5e1" }}
            transition={isSpinning ? {
              duration: 0.5,
              repeat: Infinity,
              delay: i * 0.05,
            } : {}}
          />
        ))}

        {/* Main Wheel Container */}
        <g filter="url(#innerShadow)">
          <circle cx={cx} cy={cy} r={r + 4} fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
          
          {segments.map((seg, i) => {
            const startDeg = i * slice, endDeg = (i + 1) * slice, midDeg = startDeg + slice / 2;
            const midRad = ((midDeg - 90) * Math.PI) / 180;
            const isMega = seg.type === "MEGA_REWARD";
            const lx = cx + r * 0.65 * Math.cos(midRad), ly = cy + r * 0.65 * Math.sin(midRad);
            const iconR = r * 0.4;
            
            return (
              <g key={i}>
                <path 
                  d={pieSlice(cx, cy, r, startDeg, endDeg)} 
                  fill={sliceColor(i, isMega)} 
                />
                
                {/* Visual Pegs */}
                <circle 
                  cx={cx + r * Math.cos((startDeg - 90) * Math.PI / 180)} 
                  cy={cy + r * Math.sin((startDeg - 90) * Math.PI / 180)} 
                  r="2" 
                  fill="white" 
                  fillOpacity="0.6" 
                />

                <g transform={`rotate(${midDeg}, ${cx}, ${cy})`}>
                  <text x={cx} y={cy - iconR} textAnchor="middle" dominantBaseline="middle"
                    fontSize={isMega ? "16" : "14"} fontWeight="900"
                    fill="white" fontFamily="Inter, sans-serif" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
                  >
                    {isMega ? "💎" : "🪙"}
                  </text>
                </g>
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  fontSize={isMega ? "10" : "12"} fontWeight="900"
                  fill="white" fontFamily="Inter, sans-serif"
                  transform={`rotate(${midDeg}, ${lx}, ${ly})`}
                  style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
                >
                  {isMega ? "MEGA" : seg.label}
                </text>
              </g>
            );
          })}
        </g>
        
        {/* Gloss Overlay */}
        <circle cx={cx} cy={cy} r={r} fill="url(#wheelGradient)" pointerEvents="none" />

        {/* Center hub */}
        <circle cx={cx} cy={cy} r="28" fill="#ffffff" stroke="#14b8a6" strokeWidth="4" shadow="true" />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize="8" fontWeight="900" fill="#14b8a6" fontFamily="Inter" className="tracking-widest">JUSTY</text>
      </svg>
    </div>
  );
}

const Confetti = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          initial={{
            top: "50%",
            left: "50%",
            backgroundColor: ["#14b8a6", "#f59e0b", "#10b981", "#ef4444"][i % 4],
            scale: 0,
          }}
          animate={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            scale: [0, 1.5, 0],
            opacity: [1, 1, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            ease: "easeOut",
            repeat: i < 10 ? Infinity : 0,
            repeatDelay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
};

export default function SpinWheel() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [campaign, setCampaign] = useState<SpinCampaign | null>(null);
  const [mySpin, setMySpin] = useState<SpinAttempt | null>(null);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SpinAttempt | null>(null);
  const [showResult, setShowResult] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const needleControls = useAnimation();
  const baseAngle = useRef(0);
  const [coinBalance, setCoinBalance] = useState(0);
  const [convertAmount, setConvertAmount] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [showCoinConvert, setShowCoinConvert] = useState(false);
  const [convertMsg, setConvertMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const segments = useMemo<Segment[]>(() => {
    if (!campaign) return [];
    const coins: Segment[] = (campaign.coinRewards || []).map((c) => ({
      type: "COINS", label: `${c.amount}`, value: c.amount,
    }));
    return [
      { type: "MEGA_REWARD", label: "MEGA", value: 0,
        megaName: campaign.megaReward?.name || "Mega Reward",
        megaImageUrl: campaign.megaReward?.imageUrl },
      ...coins,
    ];
  }, [campaign]);

  const load = async () => {
    setLoading(true); setError(""); setResult(null); setShowResult(false);
    try {
      const res = await getSpinWheelCampaign();
      if (res.success) {
        setCampaign(res.data.campaign);
        const spin = res.data.mySpin;
        const nextAt = (res.data as any).nextEligibleAt;
        setMySpin(spin && nextAt ? { ...spin, nextEligibleAt: nextAt } as any : spin);
      }
      else setError(res.message || "Failed to load spin wheel");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load");
    } finally { setLoading(false); }
  };

  const loadCoinBalance = async () => {
    try {
      const res = await getCustomerCoinBalance();
      if (res.success && res.data) setCoinBalance(res.data.coinBalance);
    } catch {}
  };

  useEffect(() => {
    if (isAuthenticated) {
      load();
      loadCoinBalance();
    }
  }, [isAuthenticated]);

  const onSpin = async () => {
    if (!campaign || spinning || !segments.length) return;
    setSpinning(true); setError(""); setResult(null); setShowResult(false);
    try {
      const res = await spinNow();
      if (!res.success || !res.data) { setError(res.message || "Spin failed"); setSpinning(false); return; }
      const spin = res.data;
      let targetIndex = 0;
      if (spin.resultType === "COINS") {
        const coins = Number(spin.coinsWon || 0);
        const idx = segments.findIndex((s, i) => i !== 0 && s.type === "COINS" && s.value === coins);
        targetIndex = idx >= 0 ? idx : 1;
      }
      
      const sliceSize = 360 / segments.length;
      const sliceMid = targetIndex * sliceSize + sliceSize / 2;
      const fullRotations = 8;
      const totalDegrees = fullRotations * 360 + (360 - sliceMid);
      const targetAngle = baseAngle.current + totalDegrees - (baseAngle.current % 360);
      
      if (wheelRef.current) {
        wheelRef.current.style.transition = "transform 5s cubic-bezier(0.15, 0, 0.15, 1)";
        wheelRef.current.style.transform = `rotate(${targetAngle}deg)`;
      }

      // Needle Wiggle Simulation
      let lastWiggle = 0;
      const wiggleInterval = setInterval(() => {
        if (!wheelRef.current) return;
        const st = window.getComputedStyle(wheelRef.current);
        const tr = st.getPropertyValue("transform");
        if (tr === "none") return;
        
        const values = tr.split("(")[1].split(")")[0].split(",");
        const a = parseFloat(values[0]);
        const b = parseFloat(values[1]);
        let angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
        if (angle < 0) angle += 360;
        
        // Every time a peg passes (slice boundary)
        const currentSegment = Math.floor(angle / sliceSize);
        if (currentSegment !== lastWiggle) {
          lastWiggle = currentSegment;
          needleControls.start({
            rotate: [0, -15, 0],
            transition: { duration: 0.1 }
          });
        }
      }, 50);

      setMySpin(spin); setResult(spin);
      if ((spin as any).coinBalance !== undefined) setCoinBalance((spin as any).coinBalance);
      
      setTimeout(() => {
        clearInterval(wiggleInterval);
        baseAngle.current = targetAngle % 360;
        if (wheelRef.current) { 
          wheelRef.current.style.transition = "none"; 
          wheelRef.current.style.transform = `rotate(${baseAngle.current}deg)`; 
        }
        setSpinning(false); 
        setShowResult(true);
      }, 5200);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Spin failed"); setSpinning(false);
    }
  };

  const canSpin = !mySpin && !spinning;
  const nextEligibleDate = useMemo(() => getNextEligibleDate(mySpin), [mySpin]);
  const countdown = useCountdown(nextEligibleDate);

  const handleConvertCoins = async () => {
    const coins = Number(convertAmount);
    if (!coins || coins < 10 || coins % 10 !== 0) {
      setConvertMsg({ text: "Enter a valid amount (min 10, multi of 10)", ok: false }); return;
    }
    if (coins > coinBalance) { setConvertMsg({ text: "Insufficient balance", ok: false }); return; }
    try {
      setIsConverting(true); setConvertMsg(null);
      const res = await convertCustomerCoins(coins);
      if (res.success && res.data) {
        setCoinBalance(res.data.coinBalance);
        setConvertMsg({ text: `✅ ₹${res.data.rupeesEarned} added to wallet!`, ok: true });
        setConvertAmount(""); setShowCoinConvert(false);
      } else setConvertMsg({ text: res.message || "Failed", ok: false });
    } catch (e: any) { setConvertMsg({ text: e?.response?.data?.message || "Failed", ok: false }); } 
    finally { setIsConverting(false); }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 selection:bg-teal-500/10">
      {/* ── Floating Header ── */}
      <div className="bg-gradient-to-br from-teal-600 to-emerald-600 rounded-b-[40px] shadow-lg relative pb-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between px-4 py-4 pt-6 relative z-10">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white active:scale-95 transition-transform">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
            Daily Spin
          </div>
        </div>

        <div className="px-8 pb-4 text-white relative z-10">
          <motion.h1 initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} className="text-3xl font-black mb-1 drop-shadow-sm">Daily Fortune 🎡</motion.h1>
          <motion.p initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay:0.1}} className="text-xs text-emerald-100 font-medium opacity-90 max-w-[240px]">Spin once every 24 hours to win coins and mega rewards!</motion.p>
        </div>
      </div>

      <div className="px-4 -mt-8 relative z-20 space-y-5">
        {error && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold p-4 rounded-3xl text-center shadow-sm uppercase tracking-wide">⚠️ {error}</motion.div>}

        {!isAuthenticated ? (
           <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white rounded-[40px] p-8 text-center shadow-xl border border-neutral-100">
             <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-4xl">🎡</span></div>
             <h2 className="text-xl font-black text-neutral-900 mb-2">Ready to Spin?</h2>
             <p className="text-sm text-neutral-500 mb-8 leading-relaxed">Log in to test your luck and earn rewards for your next purchase.</p>
             <button onClick={() => navigate("/login")} className="w-full py-4 rounded-3xl bg-teal-600 text-white font-black text-sm shadow-lg shadow-teal-100 active:scale-95 transition-all">Login to Continue</button>
           </motion.div>
        ) : campaign ? (
          <div className="bg-white rounded-[40px] p-4 py-8 shadow-xl border border-neutral-100 overflow-hidden relative">
            <div className="absolute top-4 w-full flex justify-center left-0">
               <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter ${canSpin ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-neutral-100 text-neutral-400"}`}>
                 {canSpin ? "Free Spin Ready" : "Cooldown Active"}
               </span>
            </div>

            <div className="flex flex-col items-center pt-8">
               <div className="relative mb-10 w-full flex justify-center" style={{ maxWidth: 320 }}>
                  <div className="relative aspect-square w-full max-w-[300px]">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center">
                      <motion.div 
                        animate={needleControls}
                        style={{ transformOrigin: "top center" }}
                        className="flex flex-col items-center"
                      >
                        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-neutral-800 relative z-10" 
                             style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.15))" }} />
                        <div className="w-3 h-3 rounded-full bg-neutral-800 -mt-24 z-20 shadow-md" />
                      </motion.div>
                    </div>

                    <SpinWheelSVG segments={segments} wheelRef={wheelRef} isSpinning={spinning} />
                    
                    <button type="button" onClick={onSpin} disabled={!canSpin || spinning}
                      className="absolute w-20 h-20 rounded-full bg-white text-teal-600 text-sm font-black shadow-[0_10px_25px_rgba(20,184,166,0.15)] border-4 border-neutral-50 z-50 disabled:opacity-50 active:scale-90 transition-all flex items-center justify-center uppercase tracking-widest"
                      style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
                      {spinning ? "..." : "SPIN"}
                    </button>
                  </div>
               </div>

               <div className="flex flex-wrap justify-center gap-2 px-4 mb-4">
                 {segments.map((s, i) => (
                   <div key={i} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${s.type === "MEGA_REWARD" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-neutral-50 text-neutral-500 border-neutral-100"}`}>
                     {s.type === "MEGA_REWARD" ? "💎" : "🪙"} {s.label}
                   </div>
                 ))}
               </div>
            </div>

            {!canSpin && !spinning && (
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="mx-2 rounded-[32px] bg-neutral-50 p-6 border border-neutral-100 text-center">
                 <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] mb-4">Next Spin In</p>
                 <div className="flex justify-center gap-3">
                    {countdown.split(":").map((part, i) => (
                       <div key={i} className="flex flex-col items-center">
                          <span className="text-3xl font-black text-neutral-800 tracking-wider font-mono">{part}</span>
                          <span className="text-[8px] text-neutral-400 font-bold uppercase mt-1 tracking-widest">{["HRS", "MIN", "SEC"][i]}</span>
                       </div>
                    ))}
                 </div>
              </motion.div>
            )}
          </div>
        ) : !loading && (
          <div className="bg-white rounded-[40px] p-24 text-center border border-neutral-100 shadow-xl text-neutral-300 font-black uppercase tracking-widest">
             No active campaign
          </div>
        )}

        {/* Coin Balance Card */}
        {isAuthenticated && (
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white rounded-[40px] p-4 sm:p-6 shadow-xl border border-neutral-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 bg-teal-500 rounded-bl-[100px]" />
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-inner group-hover:rotate-12 transition-transform">🪙</div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Your Coins</p>
                    <p className="text-2xl sm:text-3xl font-black text-neutral-900">{coinBalance.toLocaleString("en-IN")}</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Worth</p>
                  <p className="text-lg sm:text-xl font-black text-neutral-900">₹{(coinBalance / 10).toFixed(1)}</p>
               </div>
            </div>

            <button onClick={() => { setShowCoinConvert(!showCoinConvert); setConvertMsg(null); }} className="w-full py-4 rounded-2xl bg-neutral-900 text-white font-black text-[11px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
              <span>💸</span> Convert to Wallet
              <svg className={`w-4 h-4 transition-transform ${showCoinConvert ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
            </button>

            <AnimatePresence>
              {showCoinConvert && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                   <div className="mt-5 pt-5 border-t border-neutral-50 flex flex-col gap-4">
                      {convertMsg && <div className={`text-[10px] font-black uppercase tracking-widest p-3 rounded-xl border ${convertMsg.ok ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}> {convertMsg.text} </div>}
                      <div className="flex gap-2">
                        <input type="number" value={convertAmount} onChange={e => setConvertAmount(e.target.value)} placeholder={`Max ${coinBalance}`} min={10} step={10} className="flex-1 min-w-0 bg-neutral-50 px-4 sm:px-5 py-3.5 rounded-2xl text-sm font-black focus:outline-none border border-neutral-100" />
                        <button onClick={handleConvertCoins} disabled={isConverting || !convertAmount} className="px-5 sm:px-6 py-3.5 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 whitespace-nowrap"> {isConverting ? "..." : "Confirm"} </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {[10, 50, 100, 500].filter(v => v <= coinBalance).map(v => (
                           <button key={v} onClick={() => setConvertAmount(String(v))} className="px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-500 text-[10px] font-black border border-neutral-200 hover:bg-teal-50 hover:text-teal-600 transition-colors uppercase">{v}</button>
                         ))}
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && result && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-neutral-900/40 backdrop-blur-md">
            <Confetti />
            <motion.div initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:1.2, opacity:0}} className="bg-white rounded-[56px] p-10 text-center shadow-2xl relative max-w-sm w-full overflow-hidden border border-neutral-100">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500" />
              <motion.div 
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className={`${result.resultType === "MEGA_REWARD" ? "text-7xl" : "text-6xl"} mb-6`}
              >
                {result.resultType === "MEGA_REWARD" ? "💎" : "🪙"}
              </motion.div>
              <h2 className="text-2xl font-black text-neutral-900 mb-2">Congratulations!</h2>
              <p className="text-base font-bold text-teal-600 mb-8 px-4">
                {result.resultType === "MEGA_REWARD" ? `You've unlocked: ${result.megaRewardName}!` : `You've won ${Number(result.coinsWon || 0)} coins!`}
              </p>
              <button onClick={() => setShowResult(false)} className="w-full py-4 rounded-[28px] bg-neutral-900 text-white font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all">Claim Reward ✨</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
