import { useState, useEffect, useCallback } from "react";
import {
  getAllComplaints,
  getComplaintStats,
  respondToComplaint,
  type IComplaint,
  type ComplaintStats,
} from "../../../services/api/admin/adminComplaintService";

const STATUS_OPTIONS = ["All", "Open", "In Progress", "Resolved", "Closed"];
const TYPE_OPTIONS = ["All", "Customer", "Seller"];
const PRIORITY_OPTIONS = ["All", "Low", "Medium", "High", "Urgent"];

const statusColor: Record<string, string> = {
  Open: "bg-yellow-100 text-yellow-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Resolved: "bg-green-100 text-green-800",
  Closed: "bg-gray-100 text-gray-700",
};

const priorityColor: Record<string, string> = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-orange-100 text-orange-700",
  Urgent: "bg-red-100 text-red-700",
};

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [selected, setSelected] = useState<IComplaint | null>(null);
  const [responseText, setResponseText] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 15 };
      if (statusFilter !== "All") params.status = statusFilter;
      if (typeFilter !== "All") params.raisedByType = typeFilter;
      if (priorityFilter !== "All") params.priority = priorityFilter;
      if (search) params.search = search;

      const data = await getAllComplaints(params);
      setComplaints(data.complaints);
      setTotal(data.pagination.total);
      setPages(data.pagination.pages);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, priorityFilter, search]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  useEffect(() => {
    getComplaintStats().then(setStats).catch(() => {});
  }, []);

  const openDetail = (c: IComplaint) => {
    setSelected(c);
    setResponseText(c.response || "");
    setNewStatus(c.status);
    setSuccessMsg("");
  };

  const handleSubmitResponse = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const updated = await respondToComplaint(selected._id, {
        status: newStatus || undefined,
        response: responseText || undefined,
      });
      setSelected(updated);
      setSuccessMsg("Response saved successfully.");
      fetchComplaints();
      getComplaintStats().then(setStats).catch(() => {});
    } catch {
      setSuccessMsg("Failed to save response.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Complaints & Support</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and respond to customer and seller complaints</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Total", value: stats.total, color: "bg-gray-50 border-gray-200" },
            { label: "Open", value: stats.open, color: "bg-yellow-50 border-yellow-200" },
            { label: "In Progress", value: stats.inProgress, color: "bg-blue-50 border-blue-200" },
            { label: "Resolved", value: stats.resolved, color: "bg-green-50 border-green-200" },
            { label: "Closed", value: stats.closed, color: "bg-gray-50 border-gray-200" },
            { label: "Customers", value: stats.fromCustomers, color: "bg-teal-50 border-teal-200" },
            { label: "Sellers", value: stats.fromSellers, color: "bg-purple-50 border-purple-200" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-3 ${s.color}`}>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search subject or message..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
        </select>

        {(search || statusFilter !== "All" || typeFilter !== "All" || priorityFilter !== "All") && (
          <button
            onClick={() => { setSearch(""); setSearchInput(""); setStatusFilter("All"); setTypeFilter("All"); setPriorityFilter("All"); setPage(1); }}
            className="text-sm text-gray-500 hover:text-gray-800 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">From</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Priority</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    No complaints found
                  </td>
                </tr>
              ) : (
                complaints.map((c, i) => (
                  <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{(page - 1) * 15 + i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate">{c.subject}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.raisedByType === "Customer"
                        ? c.customer?.name || "—"
                        : c.seller?.name || c.seller?.shopName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.raisedByType === "Customer" ? "bg-teal-100 text-teal-700" : "bg-purple-100 text-purple-700"}`}>
                        {c.raisedByType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.category}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor[c.priority] || ""}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] || ""}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(c)}
                        className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs hover:bg-teal-700 transition-colors"
                      >
                        View / Respond
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selected.subject}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selected.raisedByType} · {selected.category} · {new Date(selected.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6L18 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Submitter info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
                    {selected.raisedByType === "Customer" ? "Customer" : "Seller"}
                  </p>
                  <p className="font-medium text-gray-800">
                    {selected.raisedByType === "Customer"
                      ? selected.customer?.name || "—"
                      : selected.seller?.name || selected.seller?.shopName || "—"}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {selected.raisedByType === "Customer"
                      ? selected.customer?.email
                      : selected.seller?.email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-start">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[selected.status]}`}>
                    {selected.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor[selected.priority]}`}>
                    {selected.priority}
                  </span>
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Message</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 whitespace-pre-wrap">{selected.message}</p>
              </div>

              {/* Existing admin response */}
              {selected.response && (
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Previous Response</p>
                  <p className="text-sm text-gray-700 bg-teal-50 rounded-xl p-4 whitespace-pre-wrap border border-teal-100">
                    {selected.response}
                  </p>
                  {selected.respondedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Responded on {new Date(selected.respondedAt).toLocaleString("en-IN")}
                      {selected.respondedBy ? ` by ${selected.respondedBy.name}` : ""}
                    </p>
                  )}
                </div>
              )}

              {/* Admin response form */}
              <div className="border-t border-gray-200 pt-5 space-y-4">
                <p className="text-sm font-semibold text-gray-800">Update Status & Respond</p>

                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1.5">Update Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {["Open", "In Progress", "Resolved", "Closed"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1.5">Response to {selected.raisedByType}</label>
                  <textarea
                    rows={4}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response here..."
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>

                {successMsg && (
                  <p className={`text-sm font-medium ${successMsg.includes("success") ? "text-green-600" : "text-red-500"}`}>
                    {successMsg}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitResponse}
                    disabled={submitting}
                    className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "Saving..." : "Save Response"}
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
