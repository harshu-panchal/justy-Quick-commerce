import { useState, useEffect } from "react";
import { getOnboardingPayments, OnboardingPayment } from "../../../services/api/admin/adminPaymentService";
import { useAuth } from "../../../context/AuthContext";

export default function AdminOnboardingPayments() {
    const { isAuthenticated, token } = useAuth();
    const [payments, setPayments] = useState<OnboardingPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    const fetchPayments = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);
            const response = await getOnboardingPayments({ page, limit: 10 });

            if (response.success) {
                setPayments(response.data);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            } else {
                setError(response.message || "Failed to fetch payments");
            }
        } catch (err: any) {
            console.error("Error fetching onboarding payments:", err);
            setError(err.response?.data?.message || "Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchPayments();
        }
    }, [isAuthenticated, token]);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <h1 className="text-2xl font-semibold text-neutral-800">
                    Onboarding Payments
                </h1>
                <div className="text-sm text-neutral-600">
                    <span className="text-teal-600 hover:text-teal-700 cursor-pointer">
                        Dashboard
                    </span>
                    <span className="mx-2">/</span>
                    <span className="text-neutral-800">Onboarding Payments</span>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
                <div className="bg-teal-600 px-4 sm:px-6 py-3">
                    <h2 className="text-white text-lg font-semibold">
                        Seller Registration Payments
                    </h2>
                </div>

                <div className="p-4 sm:p-6 overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-2"></div>
                            <span className="text-neutral-600">Loading payments...</span>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
                            {error}
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500">
                            No onboarding payments found.
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 bg-neutral-50">
                                    <th className="px-4 py-3 text-xs font-bold text-neutral-700 uppercase">Date</th>
                                    <th className="px-4 py-3 text-xs font-bold text-neutral-700 uppercase">Seller Name</th>
                                    <th className="px-4 py-3 text-xs font-bold text-neutral-700 uppercase">Store Name</th>
                                    <th className="px-4 py-3 text-xs font-bold text-neutral-700 uppercase">Category</th>
                                    <th className="px-4 py-3 text-xs font-bold text-neutral-700 uppercase">Amount</th>
                                    <th className="px-4 py-3 text-xs font-bold text-neutral-700 uppercase">Payment ID</th>
                                    <th className="px-4 py-3 text-xs font-bold text-neutral-700 uppercase text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment._id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                                        <td className="px-4 py-4 text-sm text-neutral-600">
                                            {new Date(payment.paidAt || payment.createdAt).toLocaleString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: false
                                            })}
                                        </td>
                                        <td className="px-4 py-4 text-sm font-medium text-neutral-800">
                                            {payment.seller?.sellerName || "N/A"}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-neutral-600">
                                            {payment.seller?.storeName || "N/A"}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-md text-[10px] font-bold uppercase">
                                                {payment.seller?.category || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm font-bold text-neutral-800">
                                            ₹{(payment.amount / 1).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4 text-sm font-mono text-neutral-500">
                                            {payment.razorpayPaymentId || "N/A"}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-center">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">
                                                {payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
                        <div className="text-sm text-neutral-600">
                            Showing page {pagination.page} of {pagination.pages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchPayments(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="px-3 py-1 bg-white border border-neutral-300 rounded text-sm hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => fetchPayments(pagination.page + 1)}
                                disabled={pagination.page >= pagination.pages}
                                className="px-3 py-1 bg-white border border-neutral-300 rounded text-sm hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-neutral-500 py-4">
                Copyright © 2025. Developed By{" "}
                <a href="#" className="text-teal-600 hover:text-teal-700">
                    JYASTI builds trust - 10 Minute App
                </a>
            </div>
        </div>
    );
}
