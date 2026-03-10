import Lottie from 'lottie-react';
import verificationAnimation from '../../assets/animations/VerificationStatus.json';

const UnderReviewScreen = () => {
    const steps = [
        { id: 1, label: 'Store Registration', status: 'completed' },
        { id: 2, label: 'Admin Verification', status: 'in-progress' },
        { id: 3, label: 'Pay Security Deposit ₹1000', status: 'pending' },
        { id: 4, label: 'Start Selling', status: 'pending' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-sm">
            <div className="max-w-md w-full px-6 py-12 text-center">
                {/* Animation */}
                <div className="w-64 h-64 mx-auto mb-8">
                    <Lottie animationData={verificationAnimation} loop={true} />
                </div>

                {/* Message */}
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Your Store is Under Review
                </h2>
                <p className="text-gray-600 mb-10 leading-relaxed">
                    Our team is currently verifying your store details.<br />
                    You will be notified once your store is approved.
                </p>

                {/* Progress steps */}
                <div className="space-y-4 text-left max-w-xs mx-auto">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-3">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.status === 'completed'
                                ? 'bg-green-100 text-green-600'
                                : step.status === 'in-progress'
                                    ? 'bg-amber-100 text-amber-600 animate-pulse'
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                {step.status === 'completed' ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    step.id
                                )}
                            </div>
                            <span className={`text-sm font-medium ${step.status === 'completed'
                                ? 'text-gray-900'
                                : step.status === 'in-progress'
                                    ? 'text-amber-700'
                                    : 'text-gray-400'
                                }`}>
                                {step.label} {step.status === 'in-progress' && '(In Progress)'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UnderReviewScreen;
