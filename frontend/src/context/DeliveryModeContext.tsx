import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type DeliveryMode = 'quick' | 'scheduled';

interface DeliveryModeContextType {
    deliveryMode: DeliveryMode;
    setDeliveryMode: (mode: DeliveryMode) => void;
}

const DeliveryModeContext = createContext<DeliveryModeContextType | undefined>(undefined);

export const DeliveryModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize from localStorage if available, default to 'quick'
    const [deliveryMode, setDeliveryModeState] = useState<DeliveryMode>(() => {
        const saved = localStorage.getItem('deliveryMode');
        return (saved === 'quick' || saved === 'scheduled') ? saved : 'quick';
    });

    const setDeliveryMode = (mode: DeliveryMode) => {
        setDeliveryModeState(mode);
        localStorage.setItem('deliveryMode', mode);
    };

    return (
        <DeliveryModeContext.Provider value={{ deliveryMode, setDeliveryMode }}>
            {children}
        </DeliveryModeContext.Provider>
    );
};

export const useDeliveryMode = () => {
    const context = useContext(DeliveryModeContext);
    if (context === undefined) {
        throw new Error('useDeliveryMode must be used within a DeliveryModeProvider');
    }
    return context;
};
