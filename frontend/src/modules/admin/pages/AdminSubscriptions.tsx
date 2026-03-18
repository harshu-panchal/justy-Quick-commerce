import React, { useEffect, useMemo, useState } from "react";
import {
  AdminSubscriptionRow,
  SubscriptionType,
  getAdminSubscriptions,
} from "../../../services/api/admin/adminSubscriptionService";
import { getCustomerById, type Customer } from "../../../services/api/admin/adminCustomerService";
import { getDeliveryBoyById, type DeliveryBoy } from "../../../services/api/admin/adminDeliveryService";
import { getSellerById, type Seller } from "../../../services/api/sellerService";

const typeOptions: { label: string; value: SubscriptionType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Seller", value: "Seller" },
  { label: "Customer", value: "Customer" },
  { label: "Delivery Partner", value: "DeliveryPartner" },
];

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

export default function AdminSubscriptions() {
  const [rows, setRows] = useState<AdminSubscriptionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [type, setType] = useState<SubscriptionType | "all">("all");
  const [page, setPage] = useState(1);
  const limit = 50;

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");
  const [viewRow, setViewRow] = useState<AdminSubscriptionRow | null>(null);
  const [viewEntity, setViewEntity] = useState<Customer | DeliveryBoy | Seller | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminSubscriptions({ type, page, limit });
      if (res.success && res.data) {
        const payload: any = res.data as any;
        const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        setRows(items);
      } else {
        setRows([]);
        setError(res.message || "Failed to load subscriptions");
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load subscriptions");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const openView = async (row: AdminSubscriptionRow) => {
    setViewOpen(true);
    setViewRow(row);
    setViewEntity(null);
    setViewError("");
    setViewLoading(true);
    try {
      if (row.subType === "Customer") {
        const res = await getCustomerById(row.userId);
        if (res.success) setViewEntity(res.data);
        else setViewError(res.message || "Failed to load customer");
      } else if (row.subType === "DeliveryPartner") {
        const res = await getDeliveryBoyById(row.userId);
        if (res.success) setViewEntity(res.data);
        else setViewError(res.message || "Failed to load delivery boy");
      } else {
        const res = await getSellerById(row.userId);
        if (res.success) setViewEntity(res.data);
        else setViewError(res.message || "Failed to load seller");
      }
    } catch (e: any) {
      setViewError(e?.response?.data?.message || e?.message || "Failed to load details");
    } finally {
      setViewLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, page]);

  const groupedCounts = useMemo(() => {
    const c = { Seller: 0, Customer: 0, DeliveryPartner: 0 } as Record<SubscriptionType, number>;
    for (const r of rows) c[r.subType] = (c[r.subType] || 0) + 1;
    return c;
  }, [rows]);

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">Subscriptions</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Seller/Customer/Delivery Partner subscription list.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={type}
              onChange={(e) => {
                setPage(1);
                setType(e.target.value as any);
              }}
              className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm"
            >
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="h-10 px-4 rounded-xl border border-neutral-200 bg-white text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700">
            Seller: <b>{groupedCounts.Seller}</b>
          </span>
          <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700">
            Customer: <b>{groupedCounts.Customer}</b>
          </span>
          <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700">
            Delivery: <b>{groupedCounts.DeliveryPartner}</b>
          </span>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">{error}</div>
        ) : null}

        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-700">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">View</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Plan</th>
                  <th className="text-left px-4 py-3 font-semibold">User ID</th>
                  <th className="text-left px-4 py-3 font-semibold">Razorpay Sub ID</th>
                  <th className="text-left px-4 py-3 font-semibold">Starts</th>
                  <th className="text-left px-4 py-3 font-semibold">Ends</th>
                  <th className="text-left px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-neutral-500" colSpan={9}>
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-neutral-500" colSpan={9}>
                      No subscriptions found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r._id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openView(r)}
                          className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50"
                          title="View details"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-lg bg-neutral-100 text-neutral-700 text-xs font-semibold">
                          {r.subType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-semibold">
                          {r.status || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-neutral-900">{r.planName || "—"}</div>
                        <div className="text-[11px] text-neutral-500 break-all">{r.planId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[12px] text-neutral-800 break-all">{r.userId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[12px] text-neutral-800 break-all">{r.razorpaySubscriptionId || "—"}</div>
                        <div className="text-[11px] text-neutral-500 break-all">{r.razorpayPlanId || ""}</div>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{formatDateTime(r.startsAt)}</td>
                      <td className="px-4 py-3 text-neutral-700">{formatDateTime(r.endsAt)}</td>
                      <td className="px-4 py-3 text-neutral-700">{formatDateTime(r.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="h-10 px-4 rounded-xl border border-neutral-200 bg-white text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50"
            >
              Prev
            </button>
            <div className="text-sm text-neutral-600">
              Page <b>{page}</b>
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || rows.length < limit}
              className="h-10 px-4 rounded-xl border border-neutral-200 bg-white text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {viewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setViewOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-neutral-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-start justify-between gap-4">
              <div>
                <div className="text-base sm:text-lg font-semibold text-neutral-900">User Details</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {viewRow ? `${viewRow.subType} • ${viewRow.userId}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewOpen(false)}
                className="h-9 w-9 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 inline-flex items-center justify-center"
                aria-label="Close"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {viewLoading ? (
                <div className="text-sm text-neutral-600">Loading…</div>
              ) : viewError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">{viewError}</div>
              ) : !viewEntity ? (
                <div className="text-sm text-neutral-600">No details found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {"sellerName" in viewEntity ? (
                    <>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Seller Name</div>
                        <div className="font-semibold text-neutral-900">{viewEntity.sellerName}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Store Name</div>
                        <div className="font-semibold text-neutral-900">{viewEntity.storeName}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Mobile</div>
                        <div className="text-neutral-800">{viewEntity.mobile}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Email</div>
                        <div className="text-neutral-800 break-all">{viewEntity.email}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Status</div>
                        <div className="text-neutral-800">{viewEntity.status}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">City</div>
                        <div className="text-neutral-800">{viewEntity.city || "—"}</div>
                      </div>
                    </>
                  ) : "walletAmount" in viewEntity ? (
                    <>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Name</div>
                        <div className="font-semibold text-neutral-900">{viewEntity.name}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Phone</div>
                        <div className="text-neutral-800">{viewEntity.phone}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Email</div>
                        <div className="text-neutral-800 break-all">{viewEntity.email}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Status</div>
                        <div className="text-neutral-800">{viewEntity.status}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Wallet</div>
                        <div className="text-neutral-800">₹{Number(viewEntity.walletAmount || 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Ref Code</div>
                        <div className="text-neutral-800">{viewEntity.refCode || "—"}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Name</div>
                        <div className="font-semibold text-neutral-900">{viewEntity.name}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Mobile</div>
                        <div className="text-neutral-800">{viewEntity.mobile}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">City</div>
                        <div className="text-neutral-800">{viewEntity.city}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Status</div>
                        <div className="text-neutral-800">{viewEntity.status}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Available</div>
                        <div className="text-neutral-800">{viewEntity.available}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-500">Balance</div>
                        <div className="text-neutral-800">₹{Number(viewEntity.balance || 0).toFixed(2)}</div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

