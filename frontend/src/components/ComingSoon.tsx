import Lottie from 'lottie-react';
import comingSoonAnimation from '@assets/animation/Coming soon.json';

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
            {/* Lottie Animation */}
            <div className="w-64 h-64 md:w-80 md:h-80 mb-2">
                <Lottie
                    animationData={comingSoonAnimation}
                    loop={true}
                    className="w-full h-full"
                />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">{title}</h2>

            {/* Subtitle */}
            <p className="text-neutral-500 text-sm max-w-xs">{subtitle}</p>
        </div>
    );
}
