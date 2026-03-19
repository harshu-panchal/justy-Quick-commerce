import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getDeliverySpinWheelCampaign,
  deliverySpinNow,
  type SpinAttempt,
  type SpinCampaign,
} from "../../../services/api/deliverySpinWheelService";

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

const COIN_COLORS = ["#22c55e", "#16a34a", "#4ade80", "#15803d", "#86efac"];

function sliceColor(index: number, isMega: boolean) {
  if (isMega) return "#FFD700";
  return COIN_COLORS[index % COIN_COLORS.length];
}

function pieSlice(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg)), y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg)), y2 = cy + r * Math.sin(toRad(endDeg));
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${endDeg - startDeg > 180 ? 1 : 0},1 ${x2},${y2} Z`;
}

function SpinWheelSVG({ segments, wheelRef }: { segments: Segment[]; wheelRef: React.RefObject<HTMLDivElement> }) {
  if (!segments.length) return null;
  const cx = 150, cy = 150, r = 138, slice = 360 / segments.length;
  return (
    <div ref={wheelRef} className="w-full h-full" style={{ transformOrigin: "center center" }}>
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <circle cx={cx} cy={cy} r={r + 8} fill="#92400E" />
        <circle cx={cx} cy={cy} r={r + 3} fill="#FEF3C7" />
        {segments.map((seg, i) => {
          const startDeg = i * slice, endDeg = (i + 1) * slice, midDeg = startDeg + slice / 2;
          const midRad = ((midDeg - 90) * Math.PI) / 180;
          const isMega = seg.type === "MEGA_REWARD";
          const lx = cx + r * 0.65 * Math.cos(midRad), ly = cy + r * 0.65 * Math.sin(midRad);
          const iconR = r * 0.38;
          return (
            <g key={i}>
              <path d={pieSlice(cx, cy, r, startDeg, endDeg)} fill={sliceColor(i, isMega)} stroke="#fff" strokeWidth="2" />
              <g transform={`rotate(${midDeg}, ${cx}, ${cy})`}>
                {isMega ? (
                  <g transform={`translate(${cx}, ${cy - iconR})`}>
                    <rect x="-10" y="-7" width="20" height="14" rx="2" fill="none" stroke="#78350F" strokeWidth="2" />
                    <line x1="0" y1="-7" x2="0" y2="7" stroke="#78350F" strokeWidth="2" />
                    <line x1="-10" y1="-2" x2="10" y2="-2" stroke="#78350F" strokeWidth="2" />
                    <path d="M0,-7 C-1,-12 -6,-12 -6,-8 C-6,-4 0,-7 0,-7Z" fill="#78350F" />
                    <path d="M0,-7 C1,-12 6,-12 6,-8 C6,-4 0,-7 0,-7Z" fill="#78350F" />
                  </g>
                ) : (
                  <circle cx={cx} cy={cy - iconR} r="10" fill="#FBBF24" stroke="#92400E" strokeWidth="2" />
                )}
              </g>
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                fontSize={isMega ? "12" : slice < 50 ? "11" : "13"} fontWeight="900"
                fill={isMega ? "#78350F" : "#fff"} fontFamily="'Arial Black', Arial, sans-serif"
                stroke={isMega ? "none" : "rgba(0,0,0,0.3)"} strokeWidth="2" paintOrder="stroke"
                transform={`rotate(${midDeg}, ${lx}, ${ly})`}>
                {isMega ? "MEGA" : seg.label}
              </text>
              {!isMega && (
                <text x={lx} y={ly + (slice < 50 ? 11 : 14)} textAnchor="middle" dominantBaseline="middle"
                  fontSize={slice < 50 ? "7" : "9"} fontWeight="700" fill="rgba(255,255,255,0.9)" fontFamily="Arial, sans-serif"
                  transform={`rotate(${midDeg}, ${lx}, ${ly + (slice < 50 ? 11 : 14)})`}>
                  coins
                </text>
              )}
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="28" fill="#1F2937" stroke="white" strokeWidth="5" />
        <circle cx={cx} cy={cy} r="24" fill="#065F46" />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="900" fill="white" fontFamily="'Arial Black', Arial, sans-serif">SPIN</text>
      </svg>
    </div>
  );
}

export default function DeliverySpinWheel() {
  const [campaign, setCampaign] = useState<SpinCampaign | null>(null);
  const [mySpin, setMySpin] = useState<SpinAttempt | null>(null);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SpinAttempt | null>(null);
  const [showResult, setShowResult] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const baseAngle = useRef(0);

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
      const res = await getDeliverySpinWheelCampaign();
      if (res.success) { setCampaign(res.data.campaign); setMySpin(res.data.mySpin); }
      else setError(res.message || "Failed to load spin wheel");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onSpin = async () => {
    if (!campaign || spinning || !segments.length) return;
    setSpinning(true); setError(""); setResult(null); setShowResult(false);
    try {
      const res = await deliverySpinNow();
      if (!res.success || !res.data) { setError(res.message || "Spin failed"); setSpinning(false); return; }
      const spin = res.data;
      let targetIndex = 0;
      if (spin.resultType === "COINS") {
        const coins = Number(spin.coinsWon || 0);
        const idx = segments.findIndex((s, i) => i !== 0 && s.type === "COINS" && s.value === coins);
        targetIndex = idx >= 0 ? idx : 1;
      }
      const slice = 360 / segments.length;
      const sliceMid = targetIndex * slice + slice / 2;
      const newAngle = baseAngle.current + 360 * 8 + (360 - sliceMid - (baseAngle.current % 360));
      if (wheelRef.current) {
        wheelRef.current.style.transition = "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
        wheelRef.current.style.transform = `rotate(${newAngle}deg)`;
      }
      setMySpin(spin); setResult(spin);
      setTimeout(() => {
        baseAngle.current = newAngle % 360;
        if (wheelRef.current) { wheelRef.current.style.transition = "none"; wheelRef.current.style.transform = `rotate(${baseAngle.current}deg)`; }
        setSpinning(false); setShowResult(true);
      }, 4200);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Spin failed"); setSpinning(false);
    }
  };

  const reset = () => {
    if (wheelRef.current) { wheelRef.current.style.transition = "none"; wheelRef.current.style.transform = "rotate(0deg)"; }
    baseAngle.current = 0; setShowResult(false); setResult(null); load();
  };

  const canSpin = !mySpin && !spinning;
  const nextEligibleDate = useMemo(() => getNextEligibleDate(mySpin), [mySpin]);
  const countdown = useCountdown(nextEligibleDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4 sm:p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-amber-900">🎡 Spin &amp; Win</h1>
            <p className="text-xs text-amber-700 mt-0.5">One free spin every 24 hours</p>
          </div>
          <button onClick={reset} disabled={loading || spinning} className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50 shadow-sm">{loading ? "⟳…" : "⟳ Refresh"}</button>
        </div>
        {error && <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">⚠️ {error}</div>}
        {showResult && result && (
          <div className={`rounded-2xl p-5 text-center mb-4 shadow-xl border-2 ${result.resultType === "MEGA_REWARD" ? "bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400 border-yellow-500" : "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 border-emerald-600"} text-white`}>
            <div className="text-4xl mb-2">{result.resultType === "MEGA_REWARD" ? "🎁🎉" : "🎊🪙"}</div>
            <div className="text-lg font-extrabold drop-shadow mb-1">🎉 Congratulations!</div>
            <div className="text-2xl font-black drop-shadow">
              {result.resultType === "MEGA_REWARD" ? `You won: ${result.megaRewardName || "Mega Reward"}!` : `You won ${Number(result.coinsWon || 0)} Coins!`}
            </div>
            {result.resultType === "COINS" && <div className="mt-1 text-sm font-semibold opacity-90">🪙 {Number(result.coinsWon || 0)} coins added to your account</div>}
          </div>
        )}
        {!loading && !campaign && (
          <div className="rounded-3xl border border-amber-200 bg-white shadow p-10 text-center">
            <div className="text-5xl mb-3">🎡</div>
            <div className="text-neutral-600 font-medium">No active spin campaign</div>
          </div>
        )}
        {campaign && (
          <div className="rounded-3xl border-2 border-amber-300 bg-white shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-400 px-5 py-3 flex items-center justify-between">
              <span className="text-base font-extrabold text-white drop-shadow tracking-wide">🏆 SPIN &amp; WIN!</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${canSpin ? "bg-white text-emerald-700" : "bg-black/20 text-white"}`}>
                {canSpin ? "✅ Spin available" : countdown ? `⏱ ${countdown}` : "🕐 24h cooldown"}
              </span>
            </div>
            <div className="p-4 sm:p-5">
              <div className="rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-amber-200 p-3 flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-300 to-amber-400 flex items-center justify-center overflow-hidden flex-shrink-0 shadow">
                  {campaign.megaReward?.imageUrl ? <img src={campaign.megaReward.imageUrl} alt={campaign.megaReward.name} className="h-full w-full object-cover" /> : <span className="text-2xl">🎁</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">⭐ Grand Prize</div>
                  <div className="text-sm font-extrabold text-amber-900 truncate">{campaign.megaReward?.name || "Mega Reward"}</div>
                </div>
                <div className="text-xl">✨</div>
              </div>
              <div className="flex items-center justify-center my-2">
                <div className="relative" style={{ width: 280, height: 280 }}>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                    <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[18px] border-l-transparent border-r-transparent border-b-red-600" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }} />
                    <div className="w-4 h-4 rounded-full bg-red-600 -mt-0.5 shadow" />
                  </div>
                  <div className="absolute inset-0 rounded-full shadow-[0_0_24px_rgba(251,191,36,0.5)]" />
                  <SpinWheelSVG segments={segments} wheelRef={wheelRef} />
                  <button type="button" onClick={onSpin} disabled={!canSpin || spinning}
                    className="absolute w-16 h-16 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-700 text-white text-sm font-extrabold shadow-lg border-4 border-white z-20 disabled:opacity-60 hover:from-emerald-300 hover:to-emerald-600 active:scale-95 transition-all"
                    style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
                    {spinning ? "…" : "SPIN"}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center mt-4 mb-3">
                {segments.map((s, i) => (
                  <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${s.type === "MEGA_REWARD" ? "bg-yellow-400 text-yellow-900 border-yellow-500" : "bg-emerald-50 text-emerald-800 border-emerald-200"}`}>
                    {s.type === "MEGA_REWARD" ? "🎁" : "🪙"} {s.type === "MEGA_REWARD" ? (s.megaName || "Mega") : `${s.label} coins`}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <button type="button" onClick={onSpin} disabled={!canSpin || spinning}
                  className="py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold text-sm shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all">
                  {spinning ? "⟳ Spinning…" : canSpin ? "🎡 SPIN NOW" : "⏳ COOLDOWN"}
                </button>
                <button type="button" onClick={reset} disabled={spinning}
                  className="py-3 rounded-2xl border-2 border-amber-300 bg-white text-amber-700 font-extrabold text-sm hover:bg-amber-50 active:scale-95 transition-all disabled:opacity-50">
                  ↺ RESET
                </button>
              </div>
              {!canSpin && !spinning && (
                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
                  <div className="text-xs text-amber-600 font-semibold mb-1">⏰ Next spin available in</div>
                  <div className="text-2xl font-black text-amber-800 tracking-widest font-mono">{countdown || "00:00:00"}</div>
                  {nextEligibleDate && <div className="text-[10px] text-amber-500 mt-1">{nextEligibleDate.toLocaleString()}</div>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
