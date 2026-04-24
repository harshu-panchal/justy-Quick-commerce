import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import ExecutiveBottomNav from './ExecutiveBottomNav';
import { removeAuthToken } from '../../../services/api/config';

interface ExecutiveLayoutProps {
    children: ReactNode;
    title?: string;
    showBack?: boolean;
}

export default function ExecutiveLayout({ children, title, showBack }: ExecutiveLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [suspendedMessage, setSuspendedMessage] = useState<string | null>(null);

    useEffect(() => {
        const handleSuspended = (e: any) => {
            setSuspendedMessage(e.detail.message);
        };
        window.addEventListener('account-suspended', handleSuspended);
        return () => window.removeEventListener('account-suspended', handleSuspended);
    }, []);

    const handleModalClose = () => {
        setSuspendedMessage(null);
        removeAuthToken();
        navigate('/executive/login');
    };

    return (
        <div className="flex flex-col min-h-screen bg-neutral-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-neutral-100 px-4 py-3">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <div className="flex items-center gap-3">
                        {showBack && (
                            <button 
                                onClick={() => window.history.back()}
                                className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m15 18-6-6 6-6"/>
                                </svg>
                            </button>
                        )}
                        <h1 className="text-lg font-black tracking-tight text-neutral-900">
                            {title || 'Executive Portal'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Avatar removed as requested */}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 pb-24 overflow-x-hidden">
                <div className="max-w-lg mx-auto p-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Navigation */}
            <ExecutiveBottomNav />

            {/* Suspension Modal */}
            <AnimatePresence>
                {suspendedMessage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-neutral-900/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-black text-neutral-900 mb-2">Account Suspended</h3>
                                <p className="text-neutral-500 font-medium leading-relaxed mb-8">
                                    {suspendedMessage}
                                </p>
                                <button 
                                    onClick={handleModalClose}
                                    className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-black transition-all active:scale-95"
                                >
                                    Okay
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
