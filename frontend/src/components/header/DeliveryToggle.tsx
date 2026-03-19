import React from 'react';
import { motion } from 'framer-motion';
import { useDeliveryMode } from '../../hooks/useDeliveryMode';
import { useThemeContext } from '../../context/ThemeContext';

interface DeliveryToggleProps {
    variant?: 'default' | 'compact';
}

const DeliveryToggle: React.FC<DeliveryToggleProps> = ({ variant = 'default' }) => {
    const { deliveryMode, setDeliveryMode } = useDeliveryMode();
    const { currentTheme } = useThemeContext();

    const isCompact = variant === 'compact';
    const activeTextColor = isCompact ? '#1a1a1a' : (currentTheme.headerBg || '#007fb1');
    const inactiveTextColor = isCompact ? '#6b7280' : 'rgba(255,255,255,0.8)';

    return (
        <div className={`relative flex items-center rounded-full p-1 border transition-all duration-300 ${
            isCompact 
                ? "bg-[#f3f4f6] border-neutral-200 h-10 w-[240px] shadow-none" 
                : "bg-white/20 backdrop-blur-sm border-white/10 shadow-lg h-12 md:h-14 w-full"
        }`}>
            {/* Sliding background */}
            <motion.div
                className={`absolute h-[calc(100%-8px)] rounded-full shadow-md z-0 ${
                    isCompact ? "bg-white" : "bg-white"
                }`}
                initial={false}
                animate={{
                    x: deliveryMode === 'quick' ? 0 : '100%',
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                style={{ width: 'calc(50% - 4px)' }}
            />

            {/* Quick Option */}
            <button
                onClick={() => setDeliveryMode('quick')}
                className={`relative z-10 flex-1 h-full rounded-full flex items-center justify-center gap-2 transition-colors duration-300`}
                style={{ color: deliveryMode === 'quick' ? activeTextColor : inactiveTextColor }}
            >
                <div className="flex items-center gap-1">
                    {deliveryMode === 'quick' && isCompact && (
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-600">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                         </svg>
                    )}
                    <span className={`${isCompact ? "text-xs font-bold" : "text-xl italic font-black"}`}>
                        {isCompact ? "Quick Delivery" : "⚡Quick"}
                    </span>
                </div>
            </button>

            {/* Scheduled Option */}
            <button
                onClick={() => setDeliveryMode('scheduled')}
                className={`relative z-10 flex-1 h-full rounded-full flex items-center justify-center gap-2 transition-colors duration-300`}
                style={{ color: deliveryMode === 'scheduled' ? activeTextColor : inactiveTextColor }}
            >
                <span className={`${isCompact ? "text-xs font-bold" : "text-base font-bold tracking-tight"}`}>
                    Scheduled
                </span>
            </button>
        </div>
    );
};

export default DeliveryToggle;
