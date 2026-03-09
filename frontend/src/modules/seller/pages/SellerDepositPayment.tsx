import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { createSellerDepositOrder, verifySellerDepositPayment } from '../../../services/api/paymentService';

declare global {
    interface Window {
        Razorpay: any;
    }
}

const SellerDepositPayment = () => {
    const navigate = useNavigate();
    const { user, logout, updateUser } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const steps = [
        { id: 1, label: 'Store Registration', status: 'completed' },
        { id: 2, label: 'Admin Verification', status: 'completed' },
        { id: 3, label: 'Pay Security Deposit ₹1000', status: 'in-progress' },
        { id: 4, label: 'Start Selling', status: 'pending' },
    ];

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        try {
            setLoading(true);

            // Step 1: Load Razorpay script & Call backend create-order API
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                showToast('Failed to load Razorpay SDK.', 'error');
                setLoading(false);
                return;
            }

            const orderResponse = await createSellerDepositOrder();
            if (!orderResponse.success) {
                showToast(orderResponse.message || 'Failed to create payment order', 'error');
                setLoading(false);
                return;
            }

            const { razorpayOrderId, razorpayKey, amount, currency } = orderResponse.data;

            // Step 2: Open Razorpay checkout with order_id
            const options = {
                key: razorpayKey,
                amount: amount,
                currency: currency,
                name: 'Jasti',
                description: 'Security Deposit for Seller Panel',
                order_id: razorpayOrderId,
                prefill: {
                    name: user?.sellerName || '',
                    email: user?.email || '',
                    contact: user?.mobile || '',
                },
                theme: { color: '#0d9488' },
                // Step 3 & 4: After success, send for verification
                handler: async function (response: any) {
                    try {
                        setLoading(true);
                        const verificationResponse = await verifySellerDepositPayment({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });

                        if (verificationResponse.success) {
                            showToast('Payment successful! Your store is now fully activated.', 'success');

                            // Step 5: Update state and redirect
                            if (user) {
                                updateUser({
                                    ...user,
                                    ...(verificationResponse.data || {}),
                                    securityDepositStatus: 'Paid',
                                    depositPaid: true,
                                    userType: 'Seller'
                                } as any);
                            }
                            navigate('/seller', { replace: true });
                        } else {
                            showToast(verificationResponse.message || 'Payment verification failed', 'error');
                        }
                    } catch (error: any) {
                        console.error('Payment verification error:', error);
                        showToast('Payment verification failed', 'error');
                    } finally {
                        setLoading(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        showToast('Payment cancelled', 'info');
                    },
                },
            };

            const razorpay = new (window as any).Razorpay(options);
            razorpay.open();
        } catch (error: any) {
            console.error('Payment error:', error);
            showToast('Failed to initiate payment', 'error');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center">
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Deposit Required</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Great news! Your store has been approved. To start selling on Jasti, you need to pay a one-time refundable security deposit of ₹1000.
                </p>

                {/* Progress steps */}
                <div className="space-y-4 text-left max-w-xs mx-auto mb-10">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-3">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.status === 'completed'
                                ? 'bg-green-100 text-green-600'
                                : step.status === 'in-progress'
                                    ? 'bg-teal-100 text-teal-600 animate-pulse'
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
                                    ? 'text-teal-700'
                                    : 'text-gray-400'
                                }`}>
                                {step.label} {step.status === 'in-progress' && '(In Progress)'}
                            </span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handlePayment}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 mb-6 ${!loading
                        ? 'bg-gradient-to-r from-teal-600 to-teal-800 text-white'
                        : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                        }`}
                >
                    {loading ? 'Processing...' : 'Pay Deposit ₹1000'}
                </button>

                <button
                    onClick={() => {
                        logout();
                        navigate('/seller/login');
                    }}
                    className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                    Logout & Return to Login
                </button>
            </div>
        </div>
    );
};

export default SellerDepositPayment;
