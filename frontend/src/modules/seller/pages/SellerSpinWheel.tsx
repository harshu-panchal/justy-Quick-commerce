import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getSellerSpinWheelCampaign,
  sellerSpinNow,
  type SpinAttempt,
  type SpinCampaign,
} from "../../../services/api/sellerSpinWheelService";

function formatNextEligible(mySpin: SpinAttempt | null) {
  const next = (mySpin as any)?.nextEligibleAt;
  const createdAt = mySpin?.createdAt;
  const base = next ? new Date(next) : createdAt ? new Date(new Date(createdAt).getTime() + 24 * 60 * 60 * 1000) : null;
  if (!base || Number.isNaN(base.getTime())) return null;
  return base.toLocaleString();
}

const CoinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M9 10h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M9 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const GiftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 12v10H4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 7H2v5h20V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 22V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M12 7H7.5C6.12 7 5 5.88 5 4.5S6.12 2 7.5 2C11 2 12 7 12 7Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 7h4.5C17.88 7 19 5.88 19 4.5S17.88 2 16.5 2C13 2 12 7 12 7Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function SellerSpinWheel() {
  const [campaign, setCampaign] = useState<SpinCampaign | null>(null);
  const [mySpin, setMySpin] = useState<SpinAttempt | null>(null);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const wheelRef = useRef<HTMLDivElement>(null);

  const segments = useMemo(() => {
    if (!campaign) return [];
    const coins = (campaign.coinRewards || []).map((c) => ({
      type: "COINS" as const,
      label: `${c.amount}`,
      value: c.amount,
    }));
    // Mega as one slice
    const mega = {
      type: "MEGA_REWARD" as const,
      label: "MEGA",
      value: 0,
      megaName: campaign.megaReward?.name || "Mega Reward",
      megaImageUrl: campaign.megaReward?.imageUrl,
    };
    return [mega, ...coins];
  }, [campaign]);

  const wheelStyle = useMemo(() => {
    if (!segments.length) return {};
    // Warm theme like the reference screenshot
    const colors = segments.map((s, i) => {
      if (s.type === "MEGA_REWARD") return "#f7d774"; // golden
      return i % 2 === 0 ? "#fde68a" : "#fbbf24"; // yellow shades
    });
    const slice = 360 / segments.length;
    const stops: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const start = i * slice;
      const end = (i + 1) * slice;
      stops.push(`${colors[i]} ${start}deg ${end}deg`);
    }
    return { background: `conic-gradient(${stops.join(",")})` } as React.CSSProperties;
  }, [segments]);

  const load = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await getSellerSpinWheelCampaign();
      if (res.success) {
        setCampaign(res.data.campaign);
        setMySpin(res.data.mySpin);
      } else {
        setError(res.message || "Failed to load spin wheel");
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load spin wheel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rotateToResult = (spin: SpinAttempt) => {
    if (!campaign || !wheelRef.current || !segments.length) return;
    let targetIndex = 0;
    if (spin.resultType === "MEGA_REWARD") targetIndex = 0;
    else {
      const coins = Number(spin.coinsWon || 0);
      const idx = segments.findIndex((s, i) => i !== 0 && s.type === "COINS" && s.value === coins);
      targetIndex = idx >= 0 ? idx : 1;
    }

    const slice = 360 / segments.length;
    const sliceMiddle = targetIndex * slice + slice / 2;
    const totalRotations = 360 * 6;
    const angle = totalRotations + (360 - sliceMiddle);

    wheelRef.current.style.transition = "transform 4s cubic-bezier(0.1, 0.8, 0.2, 1)";
    wheelRef.current.style.transform = `rotate(${angle}deg)`;
  };

  const onSpin = async () => {
    if (!campaign) return;
    setSpinning(true);
    setError("");
    setSuccess("");
    try {
      const res = await sellerSpinNow();
      if (!res.success || !res.data) {
        setError(res.message || "Spin failed");
        return;
      }
      setMySpin(res.data);
      rotateToResult(res.data);

      const msg =
        res.data.resultType === "MEGA_REWARD"
          ? `Mega reward won: ${res.data.megaRewardName || "Mega Reward"}`
          : `You won ${Number(res.data.coinsWon || 0)} coins`;
      setSuccess(msg);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Spin failed");
    } finally {
      setTimeout(() => setSpinning(false), 4200);
    }
  };

  const canSpin = useMemo(() => !mySpin, [mySpin]);
  const nextEligibleText = useMemo(() => formatNextEligible(mySpin), [mySpin]);

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">Spin &amp; Win</h1>
            <p className="text-sm text-neutral-600 mt-1">Daily spin (every 24 hours).</p>
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

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm mb-4">{error}</div> : null}
        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-sm mb-4">{success}</div>
        ) : null}

        {!campaign ? (
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6 text-sm text-neutral-600">
            No active campaign.
          </div>
        ) : (
          <div className="rounded-[28px] border border-[#E7D6B5] bg-gradient-to-b from-[#FFF6DC] to-[#FFF0C7] shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-4 flex items-center justify-between">
              <div className="text-lg sm:text-xl font-extrabold tracking-wide text-[#6B3B17]">SPIN &amp; WIN!</div>
              <div className="text-xs text-[#8A5A2B]">
                {canSpin ? "You can spin now" : nextEligibleText ? `Next spin: ${nextEligibleText}` : "Come back after 24h"}
              </div>
            </div>

            <div className="px-5 sm:px-6 pb-6">
              {/* Mega reward preview */}
              <div className="rounded-2xl border border-[#E7D6B5] bg-white/70 p-4 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-[#FFF0C7] border border-[#E7D6B5] flex items-center justify-center overflow-hidden">
                  {campaign.megaReward?.imageUrl ? (
                    <img src={campaign.megaReward.imageUrl} alt={campaign.megaReward.name} className="h-full w-full object-cover" />
                  ) : (
                    <GiftIcon className="h-7 w-7 text-[#8A5A2B]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#8A5A2B]">Mega Reward</div>
                  <div className="text-sm sm:text-base font-extrabold text-[#3B1F0B] truncate">
                    {campaign.megaReward?.name || "Mega Reward"}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center">
                <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px]">
                  {/* pointer */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
                    <div className="h-9 w-9 rounded-full bg-[#F6B800] shadow border-4 border-white flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-[#6B3B17]" />
                    </div>
                  </div>

                  {/* outer frame */}
                  <div className="absolute inset-0 rounded-full bg-[#8A4B1E] shadow-md" />
                  <div className="absolute inset-[10px] rounded-full bg-[#F4E6C8]" />

                  {/* wheel */}
                  <div className="absolute inset-[18px] rounded-full bg-white shadow-inner border border-[#E7D6B5]" />
                  <div ref={wheelRef} className="absolute inset-[22px] rounded-full" style={wheelStyle}>
                    {/* segment labels */}
                    {segments.map((s, i) => {
                      const slice = 360 / segments.length;
                      const angle = i * slice + slice / 2; // degrees
                      const rad = (angle * Math.PI) / 180;
                      const r = 42; // percent from center
                      const x = 50 + r * Math.cos(rad);
                      const y = 50 + r * Math.sin(rad);
                      const rotate = angle + 90; // tangent-ish

                      const isMega = s.type === "MEGA_REWARD";
                      return (
                        <div
                          key={`${s.type}-${s.label}-${i}`}
                          className="absolute left-1/2 top-1/2"
                          style={{
                            transform: `translate(-50%, -50%) translate(${x - 50}%, ${y - 50}%) rotate(${rotate}deg)`,
                          }}
                        >
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                              isMega ? "bg-[#fff7d6] text-[#6B3B17]" : "bg-white/70 text-[#4B2A12]"
                            } border border-[#E7D6B5] shadow-sm`}
                            style={{ transform: `rotate(${-rotate}deg)` }}
                          >
                            {isMega ? <GiftIcon className="h-4 w-4" /> : <CoinIcon className="h-4 w-4" />}
                            <span className="text-xs font-extrabold">{isMega ? "MEGA" : s.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* center button */}
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <button
                      type="button"
                      onClick={onSpin}
                      disabled={!canSpin || spinning}
                      className="h-20 w-20 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-700 shadow-lg border-[6px] border-white text-white font-extrabold tracking-wide disabled:opacity-60"
                    >
                      {spinning ? "..." : "SPIN"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onSpin}
                  disabled={!canSpin || spinning}
                  className="w-full px-4 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-extrabold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {spinning ? "Spinning…" : canSpin ? "SPIN NOW" : "COOLDOWN (24H)"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!wheelRef.current) return;
                    wheelRef.current.style.transition = "none";
                    wheelRef.current.style.transform = "rotate(0deg)";
                    setTimeout(() => load(), 0);
                  }}
                  className="w-full px-4 py-3 rounded-2xl border border-[#E7D6B5] bg-white/70 text-sm font-extrabold text-[#6B3B17] hover:bg-white"
                >
                  RESET
                </button>
              </div>

              <div className="mt-4 text-xs text-[#8A5A2B]">
                Possible rewards:{" "}
                <span className="font-semibold">
                  {campaign.megaReward?.name || "Mega Reward"} +{" "}
                  {(campaign.coinRewards || []).map((c) => `${c.amount} coins`).join(", ")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

