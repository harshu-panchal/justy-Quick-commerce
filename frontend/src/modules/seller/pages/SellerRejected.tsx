import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const SellerRejected = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const reason = (user as any)?.rejectionReason;

    const handleLogout = () => {
        logout();
        navigate('/seller/login');
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Application Rejected
                </h2>

                <p className="text-gray-600 mb-6 leading-relaxed">
                    Your seller application has been reviewed and could not be approved at this time.
                </p>

                {reason && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-left">
                        <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Reason</p>
                        <p className="text-sm text-red-800">{reason}</p>
                    </div>
                )}

                <p className="text-sm text-gray-500 mb-8">
                    If you believe this is a mistake or have resolved the issue, please contact our support team to appeal this decision.
                </p>

                <div className="space-y-3">
                    <a
                        href="mailto:support@jyasti.com"
                        className="block w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition-colors"
                    >
                        Contact Support
                    </a>
                    <button
                        onClick={handleLogout}
                        className="block w-full py-3 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SellerRejected;
