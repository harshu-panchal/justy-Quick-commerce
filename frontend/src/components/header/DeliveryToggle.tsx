import React from 'react';
import { motion } from 'framer-motion';
import { useDeliveryMode } from '../../hooks/useDeliveryMode';
import { useThemeContext } from '../../context/ThemeContext';

const DeliveryToggle: React.FC = () => {
    const { deliveryMode, setDeliveryMode } = useDeliveryMode();
    const { currentTheme } = useThemeContext();

    const activeTextColor = currentTheme.headerBg || '#007fb1';

    return (
        <div className="relative flex items-center bg-white/20 backdrop-blur-sm rounded-full p-1.5 w-full border border-white/10 shadow-lg h-12 md:h-14">
            {/* Sliding background */}
            <motion.div
                className="absolute h-[calc(100%-12px)] rounded-full bg-white shadow-xl z-0"
                initial={false}
                animate={{
                    x: deliveryMode === 'quick' ? 0 : '100%',
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                style={{ width: 'calc(50% - 6px)' }}
            />

            {/* Quick Option */}
            <button
                onClick={() => setDeliveryMode('quick')}
                className={`relative z-10 flex-1 h-full rounded-full flex items-center justify-center gap-2 transition-colors duration-300`}
                style={{ color: deliveryMode === 'quick' ? activeTextColor : 'white' }}
            >
                <div className="flex items-center gap-1.5">
                    <span className="text-xl italic font-black">⚡Quick</span>
                </div>
            </button>

            {/* Scheduled Option */}
            <button
                onClick={() => setDeliveryMode('scheduled')}
                className={`relative z-10 flex-1 h-full rounded-full flex items-center justify-center gap-2 transition-colors duration-300`}
                style={{ color: deliveryMode === 'scheduled' ? activeTextColor : 'rgba(255,255,255,0.8)' }}
            >
                <span className="text-base font-bold tracking-tight">Scheduled</span>
            </button>
        </div>
    );
};

export default DeliveryToggle;
