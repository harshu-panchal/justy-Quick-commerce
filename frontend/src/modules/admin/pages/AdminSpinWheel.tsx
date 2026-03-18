import React, { useEffect, useMemo, useState } from "react";
import { getSpinCampaign, upsertSpinCampaign } from "../../../services/api/admin/adminSpinWheelService";
import { uploadImage } from "../../../services/api/uploadService";

export default function AdminSpinWheel() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "Spin & Win",
    isActive: true,
    megaEveryNSpins: "100",
    megaRewardName: "Mega Reward",
    megaRewardImageUrl: "",
    coinRewardsCsv: "10,20,50",
  });

  const coinAmounts = useMemo(() => {
    return form.coinRewardsCsv
      .split(",")
      .map((s) => Number(String(s).trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
      .map((n) => Math.floor(n));
  }, [form.coinRewardsCsv]);

  const load = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await getSpinCampaign();
      if (res.success && res.data) {
        setForm({
          title: res.data.title || "Spin & Win",
          isActive: Boolean(res.data.isActive),
          megaEveryNSpins: String(res.data.megaEveryNSpins || 100),
          megaRewardName: res.data.megaReward?.name || "Mega Reward",
          megaRewardImageUrl: res.data.megaReward?.imageUrl || "",
          coinRewardsCsv: (res.data.coinRewards || []).map((c) => c.amount).join(",") || "10,20,50",
        });
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load campaign");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        title: form.title,
        isActive: form.isActive,
        megaEveryNSpins: Number(form.megaEveryNSpins),
        megaRewardName: form.megaRewardName,
        megaRewardImageUrl: form.megaRewardImageUrl || undefined,
        coinRewards: coinAmounts,
      };
      const res = await upsertSpinCampaign(payload);
      if (res.success) setSuccess("Spin Wheel campaign saved.");
      else setError(res.message || "Failed to save");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onPickMegaImage = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const uploaded = await uploadImage(file, "spin-wheel");
      setForm((p) => ({ ...p, megaRewardImageUrl: uploaded.secureUrl || uploaded.url }));
      setSuccess("Mega reward image uploaded.");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">Spin Wheel</h1>
            <p className="text-sm text-neutral-600 mt-1">Configure Customer Spin & Win campaign.</p>
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

        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-neutral-900">Campaign settings</div>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Active
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-600">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-600">Mega reward every N users</label>
              <input
                value={form.megaEveryNSpins}
                onChange={(e) => setForm((p) => ({ ...p, megaEveryNSpins: e.target.value }))}
                type="number"
                min={2}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
              <div className="mt-1 text-[11px] text-neutral-500">Example: 100 or 500 (exactly 1 mega winner per N spins).</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-600">Mega reward name</label>
              <input
                value={form.megaRewardName}
                onChange={(e) => setForm((p) => ({ ...p, megaRewardName: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-600">Mega reward image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickMegaImage(e.target.files?.[0])}
                disabled={uploading}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
              />
              {form.megaRewardImageUrl ? (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={form.megaRewardImageUrl}
                    alt="Mega reward"
                    className="h-12 w-12 rounded-xl object-cover border border-neutral-200"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] text-neutral-500 truncate">{form.megaRewardImageUrl}</div>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, megaRewardImageUrl: "" }))}
                      className="mt-1 text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-neutral-500">Pick an image file to upload and auto-fill URL.</div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-600">Coin rewards (comma separated)</label>
            <input
              value={form.coinRewardsCsv}
              onChange={(e) => setForm((p) => ({ ...p, coinRewardsCsv: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              placeholder="10,20,50"
            />
            <div className="mt-1 text-[11px] text-neutral-500">These are the non-mega wheel slices (coins). Parsed: {coinAmounts.join(", ") || "—"}</div>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving || uploading || coinAmounts.length === 0}
            className="w-full px-4 py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50"
          >
            {uploading ? "Uploading image…" : saving ? "Saving…" : "Save campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}

