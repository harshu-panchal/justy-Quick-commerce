import Lottie from 'lottie-react';
import verificationAnimation from '../../../assets/animations/VerificationStatus.json';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useEffect, useState } from 'react';
import { getSellerProfile } from '../../../../src/services/api/auth/sellerAuthService';
import { useSellerSocket } from '../../../modules/seller/hooks/useSellerSocket';
import { useToast } from '../../../context/ToastContext';

const SellerVerificationPending = () => {
    const navigate = useNavigate();
    const { logout, user, updateUser } = useAuth();
    const { showToast } = useToast();
    const [checking, setChecking] = useState(false);

    // 1. WebSocket Listener for instant approval
    useSellerSocket((notification) => {
        if (notification.type === 'STATUS_UPDATE' && (notification as any).status === 'Approved') {
            console.log('🚀 Seller approved via socket!');
            showToast('Your store has been approved! Redirecting to dashboard...', 'success');
            if ((notification as any).user) {
                updateUser({ ...user, ...(notification as any).user, userType: 'Seller' });
            }
            navigate('/seller', { replace: true });
        }
    });

    // 2. Polling fallback (every 5 seconds)
    useEffect(() => {
        const pollStatus = async () => {
            if (checking) return;
            try {
                setChecking(true);
                const response = await getSellerProfile();
                if (response.success && response.data.status === 'Approved') {
                    console.log('✅ Seller approved via polling!');
                    showToast('Your store has been approved! Redirecting to dashboard...', 'success');
                    updateUser({ ...user, ...response.data, userType: 'Seller' });
                    navigate('/seller', { replace: true });
                }
            } catch (error) {
                console.error('Error polling seller status:', error);
            } finally {
                setChecking(false);
            }
        };

        const interval = setInterval(pollStatus, 5000);
        return () => clearInterval(interval);
    }, [user, navigate, updateUser, checking]);

    const steps = [
        { id: 1, label: 'Store Registration', status: 'completed' },
        { id: 2, label: 'Admin Verification', status: 'in-progress' },
        { id: 3, label: 'Pay Security Deposit ₹1000', status: 'pending' },
        { id: 4, label: 'Start Selling', status: 'pending' },
    ];

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
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
                <div className="space-y-4 text-left max-w-xs mx-auto mb-10">
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

                <button
                    onClick={() => {
                        logout();
                        navigate('/seller/login');
                    }}
                    className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                    Logout & Return to Login
                </button>
            </div>
        </div>
    );
};

export default SellerVerificationPending;
