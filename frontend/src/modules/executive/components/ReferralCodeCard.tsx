import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ReferralCodeCard({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white shadow-xl shadow-emerald-200/50">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl" />

            <div className="relative z-10">
                <p className="text-emerald-100/80 text-xs font-bold uppercase tracking-widest mb-1">Your Referral Code</p>
                <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-black tracking-tighter">{code || '---'}</h2>
                    <button 
                        onClick={copyToClipboard}
                        className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all p-3 rounded-2xl active:scale-95"
                    >
                        {copied ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                        )}
                    </button>
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <div className="px-2 py-1 bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-tighter">
                        Active
                    </div>
                    <p className="text-[10px] text-emerald-100/60 font-medium italic">Share this code with sellers to earn commission</p>
                </div>
            </div>
        </div>
    );
}
