/**
 * ProductStatusBadge - Shows approval status on seller product list.
 */

interface ProductStatusBadgeProps {
    status: "pending" | "approved" | "rejected";
}

const statusStyles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
    pending: "Pending Approval",
    approved: "Approved",
    rejected: "Rejected",
};

export default function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
    const style = statusStyles[status] || statusStyles.pending;
    const label = statusLabels[status] || statusLabels.pending;

    return (
        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${style}`}>
            {label}
        </span>
    );
}
