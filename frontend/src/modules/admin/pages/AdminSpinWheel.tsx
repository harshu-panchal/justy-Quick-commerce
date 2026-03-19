import React, { useEffect, useMemo, useRef, useState } from "react";
import { getSpinCampaign, upsertSpinCampaign } from "../../../services/api/admin/adminSpinWheelService";
import { uploadImage } from "../../../services/api/uploadService";

/* ─── helpers ──────────────────────────────────────────────────────────── */

const COIN_COLORS = ["#22c55e", "#16a34a", "#4ade80", "#15803d", "#86efac", "#059669", "#34d399"];
const MEGA_COLOR  = "#FFD700";

function sliceColor(index: number, isMega: boolean) {
  if (isMega) return MEGA_COLOR;
  return COIN_COLORS[index % COIN_COLORS.length];
}

function pieSlice(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${endDeg - startDeg > 180 ? 1 : 0},1 ${x2},${y2} Z`;
}

interface Segment {
  type: "COINS" | "MEGA_REWARD";
  label: string;
  value: number;
  megaName?: string;
}

/* ─── Live Preview Wheel ────────────────────────────────────────────────── */

function PreviewWheel({ segments }: { segments: Segment[] }) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const baseAngle = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState<Segment | null>(null);

  if (!segments.length) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">
        Add coin rewards to see preview
      </div>
    );
  }

  const cx = 150, cy = 150, r = 138;
  const slice = 360 / segments.length;

  const doSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setLanded(null);
    const targetIdx = Math.floor(Math.random() * segments.length);
    const sliceMid  = targetIdx * slice + slice / 2;
    const newAngle  = baseAngle.current + 360 * 6 + (360 - sliceMid - (baseAngle.current % 360));
    if (wheelRef.current) {
      wheelRef.current.style.transition = "transform 3s cubic-bezier(0.17,0.67,0.12,0.99)";
      wheelRef.current.style.transform  = `rotate(${newAngle}deg)`;
    }
    setTimeout(() => {
      baseAngle.current = newAngle % 360;
      if (wheelRef.current) {
        wheelRef.current.style.transition = "none";
        wheelRef.current.style.transform  = `rotate(${baseAngle.current}deg)`;
      }
      setSpinning(false);
      setLanded(segments[targetIdx]);
    }, 3200);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Wheel container */}
      <div className="relative" style={{ width: 280, height: 280 }}>
        {/* pointer */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
          <div
            className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-red-600"
            style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }}
          />
          <div className="w-4 h-4 rounded-full bg-red-600 -mt-0.5 shadow" />
        </div>

        {/* glow ring */}
        <div className="absolute inset-0 rounded-full shadow-[0_0_28px_rgba(251,191,36,0.45)]" />

        {/* spinning div */}
        <div ref={wheelRef} className="w-full h-full" style={{ transformOrigin: "center center" }}>
          <svg viewBox="0 0 300 300" className="w-full h-full">
            <defs>
              <filter id="previewShadow">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.15" />
              </filter>
            </defs>
            <circle cx={cx} cy={cy} r={r + 8} fill="#92400E" />
            <circle cx={cx} cy={cy} r={r + 3} fill="#FEF3C7" />

            {segments.map((seg, i) => {
              const startDeg = i * slice;
              const endDeg   = (i + 1) * slice;
              const midDeg   = startDeg + slice / 2;
              const midRad   = ((midDeg - 90) * Math.PI) / 180;
              const isMega   = seg.type === "MEGA_REWARD";
              const fill     = sliceColor(i, isMega);
              const labelR   = r * 0.65;
              const lx = cx + labelR * Math.cos(midRad);
              const ly = cy + labelR * Math.sin(midRad);
              const iconR  = r * 0.38;
              const iconX  = cx + iconR * Math.cos(midRad);  // eslint-disable-line @typescript-eslint/no-unused-vars
              const iconY  = cy + iconR * Math.sin(midRad);  // eslint-disable-line @typescript-eslint/no-unused-vars

              return (
                <g key={i}>
                  <path d={pieSlice(cx, cy, r, startDeg, endDeg)} fill={fill} stroke="#fff" strokeWidth="2" filter="url(#previewShadow)" />

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
                      fontSize={slice < 50 ? "7" : "9"} fontWeight="700"
                      fill="rgba(255,255,255,0.9)" fontFamily="Arial, sans-serif"
                      transform={`rotate(${midDeg}, ${lx}, ${ly + (slice < 50 ? 11 : 14)})`}>
                      coins
                    </text>
                  )}
                </g>
              );
            })}

            {/* center hub */}
            <circle cx={cx} cy={cy} r="28" fill="#1F2937" stroke="white" strokeWidth="5" />
            <circle cx={cx} cy={cy} r="24" fill="#065F46" />
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize="10" fontWeight="900" fill="white" fontFamily="'Arial Black', Arial, sans-serif">
              SPIN
            </text>
          </svg>
        </div>

        {/* center click button */}
        <button
          type="button"
          onClick={doSpin}
          disabled={spinning}
          className="absolute w-14 h-14 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-700 text-white text-xs font-extrabold shadow-lg border-4 border-white z-20 disabled:opacity-60 hover:from-emerald-300 hover:to-emerald-600 active:scale-95 transition-all"
          style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
        >
          {spinning ? "…" : "SPIN"}
        </button>
      </div>

      {/* Landed result */}
      {landed && (
        <div className={`w-full rounded-xl px-4 py-3 text-center font-bold text-sm border-2 ${
          landed.type === "MEGA_REWARD"
            ? "bg-yellow-50 border-yellow-400 text-yellow-800"
            : "bg-emerald-50 border-emerald-400 text-emerald-800"
        }`}>
          {landed.type === "MEGA_REWARD"
            ? `🎁 Landed on MEGA REWARD — "${landed.megaName || "Mega Reward"}"`
            : `🪙 Landed on ${landed.label} Coins`}
        </div>
      )}

      {/* Segments legend */}
      <div className="flex flex-wrap gap-1.5 justify-center w-full">
        {segments.map((s, i) => (
          <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
            s.type === "MEGA_REWARD"
              ? "bg-yellow-100 text-yellow-800 border-yellow-400"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}>
            {s.type === "MEGA_REWARD" ? "🎁" : "🪙"}
            {s.type === "MEGA_REWARD" ? (s.megaName || "Mega") : `${s.label} coins`}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */

export default function AdminSpinWheel() {
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");

  const [form, setForm] = useState({
    title:              "Spin & Win",
    isActive:           true,
    megaEveryNSpins:    "100",
    megaRewardName:     "Mega Reward",
    megaRewardImageUrl: "",
    coinRewardsCsv:     "10,20,50",
  });

  const coinAmounts = useMemo(() => {
    return form.coinRewardsCsv
      .split(",")
      .map((s) => Number(String(s).trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
      .map((n) => Math.floor(n));
  }, [form.coinRewardsCsv]);

  /* build preview segments — reacts to form changes live */
  const previewSegments = useMemo<Segment[]>(() => {
    const coins: Segment[] = coinAmounts.map((amt) => ({
      type: "COINS",
      label: `${amt}`,
      value: amt,
    }));
    return [
      {
        type: "MEGA_REWARD",
        label: "MEGA",
        value: 0,
        megaName: form.megaRewardName || "Mega Reward",
      },
      ...coins,
    ];
  }, [coinAmounts, form.megaRewardName]);

  const load = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await getSpinCampaign();
      if (res.success && res.data) {
        setForm({
          title:              res.data.title || "Spin & Win",
          isActive:           Boolean(res.data.isActive),
          megaEveryNSpins:    String(res.data.megaEveryNSpins || 100),
          megaRewardName:     res.data.megaReward?.name || "Mega Reward",
          megaRewardImageUrl: res.data.megaReward?.imageUrl || "",
          coinRewardsCsv:     (res.data.coinRewards || []).map((c) => c.amount).join(",") || "10,20,50",
        });
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load campaign");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const payload = {
        title:              form.title,
        isActive:           form.isActive,
        megaEveryNSpins:    Number(form.megaEveryNSpins),
        megaRewardName:     form.megaRewardName,
        megaRewardImageUrl: form.megaRewardImageUrl || undefined,
        coinRewards:        coinAmounts,
      };
      const res = await upsertSpinCampaign(payload);
      if (res.success) setSuccess("Spin Wheel campaign saved successfully!");
      else setError(res.message || "Failed to save");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const onPickMegaImage = async (file?: File | null) => {
    if (!file) return;
    setUploading(true); setError(""); setSuccess("");
    try {
      const uploaded = await uploadImage(file, "spin-wheel");
      setForm((p) => ({ ...p, megaRewardImageUrl: uploaded.secureUrl || uploaded.url }));
      setSuccess("Mega reward image uploaded.");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to upload image");
    } finally { setUploading(false); }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">🎡 Spin Wheel</h1>
            <p className="text-sm text-neutral-600 mt-1">Configure Spin &amp; Win campaign — preview updates live as you type.</p>
          </div>
          <button type="button" onClick={load} disabled={loading}
            className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium hover:bg-neutral-50 disabled:opacity-50">
            {loading ? "Refreshing…" : "↺ Refresh"}
          </button>
        </div>

        {error   && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">⚠️ {error}</div>}
        {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-sm">✅ {success}</div>}

        {/* Two-column layout: settings left, preview right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── LEFT: Settings ── */}
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-neutral-900">Campaign Settings</div>
              <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer select-none">
                <div
                  onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-teal-600" : "bg-neutral-300"}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
                </div>
                <span className={form.isActive ? "text-teal-700 font-semibold" : "text-neutral-500"}>
                  {form.isActive ? "Active" : "Inactive"}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-600">Campaign Title</label>
                <input value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-600">Mega reward every N spins</label>
                <input value={form.megaEveryNSpins}
                  onChange={(e) => setForm((p) => ({ ...p, megaEveryNSpins: e.target.value }))}
                  type="number" min={2}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <p className="mt-1 text-[11px] text-neutral-400">1 mega winner guaranteed per N spins</p>
              </div>
            </div>

            {/* Mega reward */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
              <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">🎁 Mega Reward</div>
              <div>
                <label className="text-xs font-semibold text-neutral-600">Reward Name</label>
                <input value={form.megaRewardName}
                  onChange={(e) => setForm((p) => ({ ...p, megaRewardName: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="e.g. iPhone 15, Gift Voucher ₹500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-600">Reward Image</label>
                <input type="file" accept="image/*"
                  onChange={(e) => onPickMegaImage(e.target.files?.[0])}
                  disabled={uploading}
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                />
                {uploading && <p className="mt-1 text-xs text-amber-600 animate-pulse">Uploading image…</p>}
                {form.megaRewardImageUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={form.megaRewardImageUrl} alt="Mega" className="h-14 w-14 rounded-xl object-cover border border-amber-300 shadow-sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-neutral-500 truncate">{form.megaRewardImageUrl}</div>
                      <button type="button" onClick={() => setForm((p) => ({ ...p, megaRewardImageUrl: "" }))}
                        className="mt-1 text-xs font-semibold text-red-600 hover:text-red-700">
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Coin rewards */}
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">🪙 Coin Rewards (Wheel Slices)</div>
              <input value={form.coinRewardsCsv}
                onChange={(e) => setForm((p) => ({ ...p, coinRewardsCsv: e.target.value }))}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="10,20,50,100"
              />
              <p className="text-[11px] text-neutral-500">
                Comma separated values. Parsed:{" "}
                <span className="font-semibold text-emerald-700">{coinAmounts.length ? coinAmounts.join(", ") : "—"}</span>
              </p>
              {coinAmounts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {coinAmounts.map((amt, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                      🪙 {amt}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button type="button" onClick={save}
              disabled={saving || uploading || coinAmounts.length === 0}
              className="w-full px-4 py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-all active:scale-[0.98]">
              {uploading ? "⏳ Uploading image…" : saving ? "⏳ Saving…" : "💾 Save Campaign"}
            </button>
          </div>

          {/* ── RIGHT: Live Preview ── */}
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 space-y-4 lg:sticky lg:top-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-neutral-900">🎡 Live Preview</div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${form.isActive ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                {form.isActive ? "● Active" : "○ Inactive"}
              </span>
            </div>

            <div className="text-center">
              <div className="text-base font-extrabold text-amber-900">{form.title || "Spin & Win"}</div>
              <div className="text-xs text-neutral-500 mt-0.5">1 free spin every 24 hours · 1 mega winner per {form.megaEveryNSpins} spins</div>
            </div>

            {/* Mega reward card in preview */}
            {form.megaRewardName && (
              <div className="rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-amber-200 p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-300 to-amber-400 flex items-center justify-center overflow-hidden flex-shrink-0 shadow">
                  {form.megaRewardImageUrl
                    ? <img src={form.megaRewardImageUrl} alt={form.megaRewardName} className="h-full w-full object-cover" />
                    : <span className="text-xl">🎁</span>}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">⭐ Grand Prize</div>
                  <div className="text-sm font-extrabold text-amber-900">{form.megaRewardName}</div>
                </div>
              </div>
            )}

            {/* The actual spin wheel preview */}
            <PreviewWheel key={previewSegments.map(s => s.label).join(",")} segments={previewSegments} />

            <p className="text-center text-[11px] text-neutral-400">
              👆 Click <strong>SPIN</strong> to test the wheel animation
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
