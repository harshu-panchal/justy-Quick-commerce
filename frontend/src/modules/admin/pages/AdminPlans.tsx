import React, { useEffect, useMemo, useState } from "react";
import {
  BillingPeriod,
  Plan,
  PlanType,
  createPlan,
  deletePlan,
  getPlans,
  updatePlan,
} from "../../../services/api/admin/adminPlanService";

const periodOptions: { value: BillingPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const planTypeOptions: { value: PlanType; label: string }[] = [
  { value: "Customer", label: "Customer" },
  { value: "Seller", label: "Seller" },
  { value: "DeliveryPartner", label: "Delivery Partner" },
];

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    planType: "Customer" as PlanType,
    name: "",
    points: [""] as string[],
    amount: "",
    period: "monthly" as BillingPeriod,
    isActive: true,
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({
      planType: "Customer",
      name: "",
      points: [""],
      amount: "",
      period: "monthly",
      isActive: true,
    });
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getPlans();
      if (res.success) {
        setPlans(Array.isArray(res.data) ? res.data : []);
      } else {
        setPlans([]);
        setError(res.message || "Failed to load plans");
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

  const canSubmit = useMemo(() => {
    const amount = Number(form.amount);
    return (
      form.name.trim().length > 0 &&
      Number.isFinite(amount) &&
      amount >= 0
    );
  }, [form.amount, form.name]);

  const onEdit = (p: Plan) => {
    setSuccess("");
    setError("");
    setEditingId(p._id);
    setForm({
      planType: (p as any).planType || "Customer",
      name: p.name || "",
      points: Array.isArray(p.points) && p.points.length ? p.points : [""],
      amount: String(p.amount ?? ""),
      period: p.period,
      isActive: Boolean(p.isActive),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        planType: form.planType,
        name: form.name.trim(),
        points: form.points.map((x) => x.trim()).filter(Boolean),
        amount: Number(form.amount),
        period: form.period,
        isActive: form.isActive,
      };

      const res = editingId
        ? await updatePlan(editingId, payload)
        : await createPlan(payload);

      if (!res.success) {
        setError(res.message || "Failed to save plan");
        return;
      }

      setSuccess(editingId ? "Plan updated." : "Plan created.");
      resetForm();
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (p: Plan) => {
    const ok = window.confirm(`Disable plan "${p.name}"?`);
    if (!ok) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await deletePlan(p._id);
      if (!res.success) {
        setError(res.message || "Failed to disable plan");
        return;
      }
      setSuccess("Plan disabled.");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to disable plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">Plans</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage subscription plans. Creating/updating a plan also creates a Razorpay plan and stores its ID.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium hover:bg-neutral-50"
            disabled={loading}
            title="Refresh"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSuccess("");
              setError("");
              resetForm();
            }}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700"
          >
            New Plan
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-sm">
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 sm:px-5 py-4 border-b border-neutral-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    {editingId ? "Edit plan" : "Create plan"}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    Razorpay interval is fixed to 1.
                  </div>
                </div>
                {editingId ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 text-xs">
                    Editing <span className="font-mono">{editingId.slice(-6)}</span>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-neutral-700">Plan name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g. Monthly Basic"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-700">Plan type</label>
                  <select
                    value={form.planType}
                    onChange={(e) => setForm((p) => ({ ...p, planType: e.target.value as PlanType }))}
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {planTypeOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700">Amount (INR)</label>
                  <div className="mt-1 flex items-center rounded-xl border border-neutral-300 focus-within:ring-2 focus-within:ring-teal-500">
                    <span className="px-3 text-sm text-neutral-500 border-r border-neutral-200">₹</span>
                    <input
                      value={form.amount}
                      onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                      placeholder="199"
                      inputMode="decimal"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700">Billing period</label>
                  <select
                    value={form.period}
                    onChange={(e) => setForm((p) => ({ ...p, period: e.target.value as BillingPeriod }))}
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {periodOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="text-xs font-medium text-neutral-700">Plan points</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">Add benefits shown on the plan card.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, points: [...p.points, ""] }))}
                    className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs font-semibold hover:bg-neutral-50"
                  >
                    Add point
                  </button>
                </div>

                <div className="mt-2 space-y-2">
                  {form.points.map((val, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <div className="flex items-center justify-center w-9 h-9 rounded-xl border border-neutral-300 bg-neutral-50 text-xs text-neutral-600">
                        {idx + 1}
                      </div>
                      <input
                        value={val}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            points: p.points.map((x, i) => (i === idx ? e.target.value : x)),
                          }))
                        }
                        className="flex-1 rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder={`Point ${idx + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            points: p.points.length === 1 ? [""] : p.points.filter((_, i) => i !== idx),
                          }))
                        }
                        className="px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100"
                        title="Remove"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 text-sm text-neutral-700 select-none">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                  Active
                </label>

                <div className="flex gap-2">
                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-sm font-semibold hover:bg-neutral-50"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!canSubmit || saving}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-teal-700"
                  >
                    {saving ? "Saving…" : editingId ? "Update plan" : "Create plan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="lg:col-span-3">
          <div className="flex items-end justify-between gap-3 flex-wrap mb-3">
            <div>
              <div className="text-sm font-semibold text-neutral-900">All plans</div>
              <div className="text-xs text-neutral-500 mt-0.5">
                Showing newest first. Click a card to edit.
              </div>
            </div>
            <div className="text-xs text-neutral-500">{plans.length} plan(s)</div>
          </div>

          {plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-600">
              {loading ? "Loading plans…" : "No plans found. Create your first plan from the form."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div
                  key={p._id}
                  className={`rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                    p.isActive ? "border-neutral-200" : "border-neutral-200 opacity-70"
                  }`}
                  onClick={() => onEdit(p)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onEdit(p);
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-neutral-900 line-clamp-1">{p.name}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          <span className="inline-flex items-center rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-700">
                            {(p as any).planType || "Customer"}
                          </span>
                          <span className="mx-2 text-neutral-300">•</span>
                          <span>{p.period}</span>
                        </div>
                      </div>
                      {p.isActive ? (
                        <span className="inline-flex px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 text-[11px] font-semibold">
                          Disabled
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div className="text-2xl font-bold text-neutral-900">₹{Number(p.amount || 0).toFixed(0)}</div>
                      <div className="text-xs text-neutral-500">per {p.period}</div>
                    </div>

                    <div className="mt-4 space-y-2 min-h-[84px]">
                      {Array.isArray(p.points) && p.points.length ? (
                        p.points.slice(0, 4).map((pt, idx) => (
                          <div key={idx} className="text-xs text-neutral-700 flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                            <span className="line-clamp-1">{pt}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-neutral-400">No points</div>
                      )}
                      {Array.isArray(p.points) && p.points.length > 4 ? (
                        <div className="text-[11px] text-neutral-500">+{p.points.length - 4} more</div>
                      ) : null}
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      <div className="text-[11px] text-neutral-500">Razorpay Plan ID</div>
                      <div className="mt-1 font-mono text-[11px] text-neutral-700 break-all">
                        {p.razorpayPlanId}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(p);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-semibold hover:bg-neutral-50"
                      disabled={saving}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(p);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold disabled:opacity-50 hover:bg-red-100"
                      disabled={saving || !p.isActive}
                      title={!p.isActive ? "Already disabled" : "Disable plan"}
                    >
                      Disable
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

