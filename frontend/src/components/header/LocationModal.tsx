import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../hooks/useLocation';
import { getStoredPincode } from '../PincodeSelector';

interface LocationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function LocationModal({ open, onOpenChange }: LocationModalProps) {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { requestLocation, isLocationLoading, locationError } = useLocation();
    const currentPincode = getStoredPincode();

    if (!open) return null;

    const handleDetectLocation = async () => {
        try {
            await requestLocation();
            onOpenChange(false);
        } catch (err) {
            console.error('Failed to detect location:', err);
        }
    };

    const handleSignIn = () => {
        onOpenChange(false);
        navigate('/login');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-neutral-900">Change Location</h2>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {!isAuthenticated && (
                        <div className="mb-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-sm font-semibold text-blue-900 mb-3">
                                To see all available stores and offers, please sign in.
                            </p>
                            <button
                                onClick={handleSignIn}
                                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                Sign In to See Saved Addresses
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        <button
                            onClick={handleDetectLocation}
                            disabled={isLocationLoading}
                            className="w-full flex items-center gap-3 p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-2xl transition-all group"
                        >
                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                                {isLocationLoading ? (
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2.2a8 8 0 0 1 8 8c0 7.3-8 11.8-8 11.8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                )}
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-emerald-900">Detect My Location</p>
                                <p className="text-xs text-emerald-700/70 font-medium">Using GPS for better accuracy</p>
                            </div>
                        </button>

                        {locationError && (
                            <p className="text-xs text-red-500 px-2 font-medium bg-red-50 py-1.5 rounded-lg border border-red-100">
                                ⚠️ {locationError}
                            </p>
                        )}

                        <div className="relative py-2 flex items-center">
                            <div className="flex-grow border-t border-neutral-100"></div>
                            <span className="flex-shrink mx-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">or</span>
                            <div className="flex-grow border-t border-neutral-100"></div>
                        </div>

                        <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-2xl">
                            <p className="text-xs font-bold text-neutral-500 mb-3 uppercase tracking-wider px-1">Selected Pincode</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-600">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M3 21h18M3 10h18M5 6l7-3 7 3v4H5V6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span className="font-bold text-neutral-800 tracking-tight">{currentPincode || 'Not Set'}</span>
                                </div>
                                <button
                                    onClick={() => onOpenChange(false)}
                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 px-3 py-1.5 rounded-lg"
                                >
                                    Change Pincode
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
