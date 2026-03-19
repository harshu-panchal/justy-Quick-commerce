import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getSellerSpinWheelCampaign,
  sellerSpinNow,
  getSellerCoinBalance,
  convertSellerCoins,
  type SpinAttempt,
  type SpinCampaign,
} from "../../../services/api/sellerSpinWheelService";

/* ─── helpers ───────────────────────────────────────────────────────────── */

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
      setRemaining(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return remaining;
}

/* ─── types ─────────────────────────────────────────────────────────────── */

interface Segment {
  type: "COINS" | "MEGA_REWARD";
  label: string;
  value: number;
  megaName?: string;
  megaImageUrl?: string;
}

/* ─── colors ─────────────────────────────────────────────────────────────── */

const COIN_COLORS = ["#22c55e", "#16a34a", "#4ade80", "#15803d", "#86efac"];
const MEGA_COLOR = "#FFD700";

function sliceColor(index: number, isMega: boolean) {
  if (isMega) return MEGA_COLOR;
  return COIN_COLORS[index % COIN_COLORS.length];
}

/* ─── SVG path helper ───────────────────────────────────────────────────── */

function pieSlice(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${endDeg - startDeg > 180 ? 1 : 0},1 ${x2},${y2} Z`;
}

/* ─── SpinWheel SVG ─────────────────────────────────────────────────────── */

interface WheelProps {
  segments: Segment[];
  wheelRef: React.RefObject<HTMLDivElement>;
}

function SpinWheelSVG({ segments, wheelRef }: WheelProps) {
  if (!segments.length) return null;

  const cx = 150, cy = 150, r = 138;
  const slice = 360 / segments.length;

  return (
    <div ref={wheelRef} className="w-full h-full" style={{ transformOrigin: "center center" }}>
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <defs>
          <filter id="sliceShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* outer rim */}
        <circle cx={cx} cy={cy} r={r + 8} fill="#92400E" />
        <circle cx={cx} cy={cy} r={r + 3} fill="#FEF3C7" />

        {segments.map((seg, i) => {
          const startDeg = i * slice;
          const endDeg   = (i + 1) * slice;
          const midDeg   = startDeg + slice / 2;
          const midRad   = ((midDeg - 90) * Math.PI) / 180;
          const isMega   = seg.type === "MEGA_REWARD";
          const fill     = sliceColor(i, isMega);

          /* label positions */
          const labelR = r * 0.65;
          const lx = cx + labelR * Math.cos(midRad);
          const ly = cy + labelR * Math.sin(midRad);

          const iconR  = r * 0.38;
          const iconX  = cx + iconR * Math.cos(midRad);
          const iconY  = cy + iconR * Math.sin(midRad);

          return (
            <g key={i}>
              {/* slice */}
              <path
                d={pieSlice(cx, cy, r, startDeg, endDeg)}
                fill={fill}
                stroke="#fff"
                strokeWidth="2"
                filter="url(#sliceShadow)"
              />

              {/* icon rotated to face outward */}
              <g transform={`rotate(${midDeg}, ${cx}, ${cy})`}>
                {isMega ? (
                  /* gift box */
                  <g transform={`translate(${cx}, ${cy - iconR})`}>
                    <rect x="-10" y="-7" width="20" height="14" rx="2" fill="none" stroke="#78350F" strokeWidth="2" />
                    <line x1="0" y1="-7" x2="0" y2="7" stroke="#78350F" strokeWidth="2" />
                    <line x1="-10" y1="-2" x2="10" y2="-2" stroke="#78350F" strokeWidth="2" />
                    <path d="M0,-7 C-1,-12 -6,-12 -6,-8 C-6,-4 0,-7 0,-7Z" fill="#78350F" />
                    <path d="M0,-7 C1,-12 6,-12 6,-8 C6,-4 0,-7 0,-7Z" fill="#78350F" />
                  </g>
                ) : (
                  /* coin */
                  <circle cx={cx} cy={cy - iconR} r="10" fill="#FBBF24" stroke="#92400E" strokeWidth="2" />
                )}
              </g>

              {/* text label */}
              <text
                x={lx} y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={isMega ? "12" : slice < 50 ? "11" : "13"}
                fontWeight="900"
                fill={isMega ? "#78350F" : "#fff"}
                fontFamily="'Arial Black', Arial, sans-serif"
                stroke={isMega ? "none" : "rgba(0,0,0,0.3)"}
                strokeWidth="2"
                paintOrder="stroke"
                transform={`rotate(${midDeg}, ${lx}, ${ly})`}
              >
                {isMega ? "MEGA" : seg.label}
              </text>
              {!isMega && (
                <text
                  x={lx} y={ly + (slice < 50 ? 11 : 14)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={slice < 50 ? "7" : "9"}
                  fontWeight="700"
                  fill="rgba(255,255,255,0.9)"
                  fontFamily="Arial, sans-serif"
                  transform={`rotate(${midDeg}, ${lx}, ${ly + (slice < 50 ? 11 : 14)})`}
                >
                  coins
                </text>
              )}
            </g>
          );
        })}

        {/* center hub */}
        <circle cx={cx} cy={cy} r="28" fill="#1F2937" stroke="white" strokeWidth="5" />
        <circle cx={cx} cy={cy} r="24" fill="#065F46" />
        <text
          x={cx} y={cy + 1}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="10" fontWeight="900" fill="white"
          fontFamily="'Arial Black', Arial, sans-serif"
        >
          SPIN
        </text>
      </svg>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */

export default function SellerSpinWheel() {
  const [campaign, setCampaign]   = useState<SpinCampaign | null>(null);
  const [mySpin,   setMySpin]     = useState<SpinAttempt  | null>(null);
  const [loading,  setLoading]    = useState(false);
  const [spinning, setSpinning]   = useState(false);
  const [error,    setError]      = useState("");
  const [result,   setResult]     = useState<SpinAttempt  | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [convertAmount, setConvertAmount] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [showCoinConvert, setShowCoinConvert] = useState(false);
  const [convertMsg, setConvertMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const wheelRef = useRef<HTMLDivElement>(null);
  const baseAngle = useRef(0); // accumulated rotation so wheel doesn't reset

  /* build segment list */
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

  /* fetch */
  const load = async () => {
    setLoading(true); setError(""); setResult(null); setShowResult(false);
    try {
      const res = await getSellerSpinWheelCampaign();
      if (res.success) {
        setCampaign(res.data.campaign);
        const spin = res.data.mySpin;
        const nextAt = (res.data as any).nextEligibleAt;
        if (spin && nextAt) {
          setMySpin({ ...spin, nextEligibleAt: nextAt } as any);
        } else {
          setMySpin(spin);
        }
      } else {
        setError(res.message || "Failed to load spin wheel");
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load");
    } finally { setLoading(false); }
  };

  const loadCoinBalance = async () => {
    try {
      const res = await getSellerCoinBalance();
      if (res.success && res.data) setCoinBalance(res.data.coinBalance);
    } catch {}
  };

  useEffect(() => { load(); loadCoinBalance(); }, []);

  /* spin */
  const onSpin = async () => {
    if (!campaign || spinning || !segments.length) return;
    setSpinning(true); setError(""); setResult(null); setShowResult(false);

    try {
      const res = await sellerSpinNow();
      if (!res.success || !res.data) {
        setError(res.message || "Spin failed");
        setSpinning(false);
        return;
      }

      /* compute target angle */
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

      /* animate wheel */
      if (wheelRef.current) {
        wheelRef.current.style.transition = "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
        wheelRef.current.style.transform  = `rotate(${newAngle}deg)`;
      }

      setMySpin(spin);
      setResult(spin);
      if ((spin as any).coinBalance !== undefined) setCoinBalance((spin as any).coinBalance);

      setTimeout(() => {
        baseAngle.current = newAngle % 360;
        if (wheelRef.current) {
          wheelRef.current.style.transition = "none";
          wheelRef.current.style.transform  = `rotate(${baseAngle.current}deg)`;
        }
        setSpinning(false);
        setShowResult(true);
      }, 4200);

    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Spin failed");
      setSpinning(false);
    }
  };

  const handleConvertCoins = async () => {
    const coins = Number(convertAmount);
    if (!coins || coins < 10 || coins % 10 !== 0) {
      setConvertMsg({ text: "Enter a valid amount (min 10, multiples of 10)", ok: false });
      return;
    }
    if (coins > coinBalance) {
      setConvertMsg({ text: "Insufficient coin balance", ok: false });
      return;
    }
    try {
      setIsConverting(true); setConvertMsg(null);
      const res = await convertSellerCoins(coins);
      if (res.success && res.data) {
        setCoinBalance(res.data.coinBalance);
        setConvertMsg({ text: `✅ ₹${res.data.rupeesEarned} added to your wallet!`, ok: true });
        setConvertAmount("");
        setShowCoinConvert(false);
      } else {
        setConvertMsg({ text: res.message || "Conversion failed", ok: false });
      }
    } catch (e: any) {
      setConvertMsg({ text: e?.response?.data?.message || "Conversion failed", ok: false });
    } finally { setIsConverting(false); }
  };

  const reset = () => {
    if (wheelRef.current) {
      wheelRef.current.style.transition = "none";
      wheelRef.current.style.transform  = "rotate(0deg)";
    }
    baseAngle.current = 0;
    setShowResult(false);
    setResult(null);
    load();
  };

  const canSpin = !mySpin && !spinning;
  const nextEligibleDate = useMemo(() => getNextEligibleDate(mySpin), [mySpin]);
  const countdown = useCountdown(nextEligibleDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-4 sm:p-6">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-amber-900">🎡 Spin &amp; Win</h1>
            <p className="text-xs text-amber-700 mt-0.5">One free spin every 24 hours</p>
          </div>
          <button
            onClick={() => reset()}
            disabled={loading || spinning}
            className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50 shadow-sm"
          >
            {loading ? "⟳…" : "⟳ Refresh"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4 flex gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Result modal popup */}
        {showResult && result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)" }}>
            <div className={`relative w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl border-4 ${
              result.resultType === "MEGA_REWARD"
                ? "bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400 border-yellow-500"
                : "bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 border-emerald-600"
            } text-white`}
              style={{ animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>
              {/* confetti emojis */}
              <div className="text-5xl mb-3" style={{ animation: "bounce 0.6s ease infinite alternate" }}>
                {result.resultType === "MEGA_REWARD" ? "🎁" : "🪙"}
              </div>
              <div className="text-2xl font-black drop-shadow mb-1">🎉 Congratulations!</div>
              <div className="text-3xl font-black drop-shadow mt-2">
                {result.resultType === "MEGA_REWARD"
                  ? `You won: ${result.megaRewardName || "Mega Reward"}!`
                  : `You won ${Number(result.coinsWon || 0)} Coins!`}
              </div>
              {result.resultType === "COINS" && (
                <div className="mt-3 text-base font-semibold opacity-90 bg-white/20 rounded-xl px-4 py-2">
                  🪙 {Number(result.coinsWon || 0)} coins added to your account
                </div>
              )}
              <button
                onClick={() => setShowResult(false)}
                className="mt-6 px-8 py-3 rounded-2xl bg-white font-extrabold text-base shadow-lg active:scale-95 transition-all"
                style={{ color: result.resultType === "MEGA_REWARD" ? "#92400e" : "#065f46" }}
              >
                Awesome! 🙌
              </button>
            </div>
            <style>{`
              @keyframes popIn {
                from { opacity: 0; transform: scale(0.5); }
                to   { opacity: 1; transform: scale(1); }
              }
            `}</style>
          </div>
        )}

        {/* No campaign */}
        {!loading && !campaign && (
          <div className="rounded-3xl border border-amber-200 bg-white shadow p-10 text-center">
            <div className="text-5xl mb-3">🎡</div>
            <div className="text-neutral-600 font-medium">No active spin campaign</div>
            <div className="text-sm text-neutral-400 mt-1">Check back later!</div>
          </div>
        )}

        {/* Loading */}
        {loading && !campaign && (
          <div className="rounded-3xl border border-amber-200 bg-white shadow p-10 text-center">
            <div className="text-4xl mb-3 animate-spin inline-block">🎡</div>
            <div className="text-neutral-500 text-sm mt-2">Loading…</div>
          </div>
        )}

        {/* Main card */}
        {campaign && (
          <div className="rounded-3xl border-2 border-amber-300 bg-white shadow-xl overflow-hidden">

            {/* Top banner */}
            <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-400 px-5 py-3 flex items-center justify-between">
              <span className="text-base font-extrabold text-white drop-shadow tracking-wide">
                🏆 SPIN &amp; WIN!
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                canSpin
                  ? "bg-white text-emerald-700"
                  : "bg-black/20 text-white"
              }`}>
                {canSpin ? "✅ Spin available" : countdown ? `⏱ ${countdown}` : "🕐 24h cooldown"}
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {/* Mega reward card */}
              <div className="rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-amber-200 p-3 flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-300 to-amber-400 flex items-center justify-center overflow-hidden flex-shrink-0 shadow">
                  {campaign.megaReward?.imageUrl ? (
                    <img src={campaign.megaReward.imageUrl} alt={campaign.megaReward.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl">🎁</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">⭐ Grand Prize</div>
                  <div className="text-sm font-extrabold text-amber-900 truncate">
                    {campaign.megaReward?.name || "Mega Reward"}
                  </div>
                </div>
                <div className="text-xl flex-shrink-0">✨</div>
              </div>

              {/* Wheel */}
              <div className="flex items-center justify-center my-2">
                <div className="relative" style={{ width: 280, height: 280 }}>
                  {/* pointer */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                    <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[18px] border-l-transparent border-r-transparent border-b-red-600" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }} />
                    <div className="w-4 h-4 rounded-full bg-red-600 -mt-0.5 shadow" />
                  </div>

                  {/* outer glow ring */}
                  <div className="absolute inset-0 rounded-full shadow-[0_0_24px_rgba(251,191,36,0.5)]" />

                  {/* SVG wheel (spinning div) */}
                  <SpinWheelSVG segments={segments} wheelRef={wheelRef} />

                  {/* center SPIN button */}
                  <button
                    type="button"
                    onClick={onSpin}
                    disabled={!canSpin || spinning}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-700 text-white text-sm font-extrabold shadow-lg border-4 border-white z-20 disabled:opacity-60 hover:from-emerald-300 hover:to-emerald-600 active:scale-95 transition-all"
                    style={{ width: 64, height: 64, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
                  >
                    {spinning ? "…" : "SPIN"}
                  </button>
                </div>
              </div>

              {/* Rewards legend */}
              <div className="flex flex-wrap gap-1.5 justify-center mt-4 mb-3">
                {segments.map((s, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      s.type === "MEGA_REWARD"
                        ? "bg-yellow-400 text-yellow-900 border-yellow-500"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    {s.type === "MEGA_REWARD" ? "🎁" : "🪙"}
                    {" "}
                    {s.type === "MEGA_REWARD" ? (s.megaName || "Mega") : `${s.label} coins`}
                  </span>
                ))}
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  onClick={onSpin}
                  disabled={!canSpin || spinning}
                  className="py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold text-sm shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  {spinning ? "⟳ Spinning…" : canSpin ? "🎡 SPIN NOW" : "⏳ COOLDOWN"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  disabled={spinning}
                  className="py-3 rounded-2xl border-2 border-amber-300 bg-white text-amber-700 font-extrabold text-sm hover:bg-amber-50 active:scale-95 transition-all disabled:opacity-50"
                >
                  ↺ RESET
                </button>
              </div>

              {/* Cooldown notice */}
              {!canSpin && !spinning && (
                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
                  <div className="text-xs text-amber-600 font-semibold mb-1">⏰ Next spin available in</div>
                  <div className="text-2xl font-black text-amber-800 tracking-widest font-mono">
                    {countdown || "00:00:00"}
                  </div>
                  {nextEligibleDate && (
                    <div className="text-[10px] text-amber-500 mt-1">
                      {nextEligibleDate.toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coin Balance & Convert Card */}
        <div className="mt-5 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 shadow-lg p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-amber-200/30 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-200 flex items-center justify-center text-xl">🪙</div>
                <div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Your Coin Balance</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-amber-600">{coinBalance.toLocaleString("en-IN")}</span>
                    <span className="text-xs font-bold text-amber-500">coins</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-amber-600/70 font-medium">Worth</p>
                <p className="text-sm font-black text-amber-700">₹{(coinBalance / 10).toFixed(1)}</p>
                <p className="text-[9px] text-amber-500/80">10 coins = ₹1</p>
              </div>
            </div>

            {convertMsg && (
              <div className={`mb-3 rounded-xl px-3 py-2 text-xs font-bold ${convertMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                {convertMsg.text}
              </div>
            )}

            {coinBalance >= 10 ? (
              <>
                <button
                  onClick={() => { setShowCoinConvert(v => !v); setConvertMsg(null); }}
                  className="w-full py-2.5 rounded-2xl bg-amber-500 text-white font-bold text-sm shadow-md shadow-amber-300/40 hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span>💸</span> Convert to Wallet Balance
                  <svg className={`w-4 h-4 transition-transform ${showCoinConvert ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {showCoinConvert && (
                  <div className="mt-3 bg-white/70 rounded-2xl p-4 border border-amber-100">
                    <p className="text-xs text-amber-700 font-bold mb-2">Enter coins (multiples of 10)</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={convertAmount}
                        onChange={e => setConvertAmount(e.target.value)}
                        placeholder={`Max ${coinBalance}`}
                        min={10} max={coinBalance} step={10}
                        className="flex-1 px-3 py-2.5 rounded-xl border border-amber-200 text-sm font-bold text-amber-900 bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                      />
                      <button
                        onClick={handleConvertCoins}
                        disabled={isConverting}
                        className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
                      >
                        {isConverting ? "…" : "Convert"}
                      </button>
                    </div>
                    {convertAmount && Number(convertAmount) >= 10 && Number(convertAmount) % 10 === 0 && (
                      <p className="mt-2 text-xs text-green-600 font-bold">= ₹{(Number(convertAmount) / 10).toFixed(0)} will be added to wallet</p>
                    )}
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {[10, 20, 50, 100].filter(v => v <= coinBalance).map(v => (
                        <button key={v} onClick={() => setConvertAmount(String(v))} className="px-3 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 hover:bg-amber-200 transition-colors">{v} 🪙</button>
                      ))}
                      {coinBalance >= 10 && (
                        <button onClick={() => setConvertAmount(String(Math.floor(coinBalance / 10) * 10))} className="px-3 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 hover:bg-amber-200 transition-colors">All</button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-xs text-amber-600/70 py-2 font-medium">Spin the wheel to earn coins! Min 10 coins to convert.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
