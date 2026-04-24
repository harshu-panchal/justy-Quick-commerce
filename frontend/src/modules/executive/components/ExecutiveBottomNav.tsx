import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';

const navItems = [
    {
        label: 'Home',
        path: '/executive/dashboard',
        icon: (active: boolean) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
                <path d="M3 9.5L12 3.5L21 9.5V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V9.5Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 21V12H15V21" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    },
    {
        label: 'Sellers',
        path: '/executive/sellers',
        icon: (active: boolean) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        )
    },
    {
        label: 'Wallet',
        path: '/executive/wallet',
        icon: (active: boolean) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        )
    },
    {
        label: 'Profile',
        path: '/executive/profile',
        icon: (active: boolean) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
        )
    }
];

export default function ExecutiveBottomNav() {
    const location = useLocation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-100 px-6 py-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex justify-between items-center max-w-lg mx-auto">
                {navItems.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="relative flex flex-col items-center gap-1 min-w-[64px]"
                        >
                            <motion.div
                                animate={{
                                    scale: active ? 1.1 : 1,
                                    color: active ? '#10b981' : '#94a3b8'
                                }}
                                className="relative flex flex-col items-center gap-0.5"
                            >
                                {item.icon(active)}
                                <span className={cn(
                                    "text-[10px] font-bold tracking-tight",
                                    active ? "text-emerald-500" : "text-neutral-400"
                                )}>
                                    {item.label}
                                </span>
                                {active && (
                                    <motion.div
                                        layoutId="executive-nav-indicator"
                                        className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-emerald-500"
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
