/**
 * ProductLimitIndicator - Shows product count progress bar for seller dashboard.
 */

interface ProductLimitIndicatorProps {
    currentCount: number;
    maxLimit?: number;
}

export default function ProductLimitIndicator({
    currentCount,
    maxLimit = 200,
}: ProductLimitIndicatorProps) {
    const percentage = Math.min((currentCount / maxLimit) * 100, 100);
    const isLimitReached = currentCount >= maxLimit;

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-neutral-800">Products Added</h3>
                <span className="text-sm font-bold text-neutral-900">
                    {currentCount} / {maxLimit}
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isLimitReached
                        ? "bg-red-500"
                        : percentage > 75
                            ? "bg-amber-500"
                            : "bg-green-500"
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Warning */}
            {isLimitReached && (
                <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-red-500 flex-shrink-0 mt-0.5"
                    >
                        <path
                            d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <p className="text-xs text-red-700">
                        {currentCount > maxLimit
                            ? "You have exceeded the free product limit."
                            : "You have reached the free product limit. Additional products may require extra charges."}
                    </p>
                </div>
            )}
        </div>
    );
}
