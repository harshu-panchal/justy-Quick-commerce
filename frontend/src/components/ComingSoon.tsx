/**
 * ComingSoon - Shown when a category is not available in the selected pincode.
 */

interface ComingSoonProps {
    title?: string;
    subtitle?: string;
}

export default function ComingSoon({
    title = "Coming Soon",
    subtitle = "This category is not available in your area yet.",
}: ComingSoonProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
            {/* Icon */}
            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-amber-500"
                >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">{title}</h2>

            {/* Subtitle */}
            <p className="text-neutral-500 text-sm max-w-xs">{subtitle}</p>
        </div>
    );
}
