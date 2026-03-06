/**
 * PincodeSelector - Compact pincode input in the header area.
 * Stores selected pincode in localStorage for persistence.
 */
import { useState, useEffect, useRef } from "react";

const PINCODE_STORAGE_KEY = "selected_pincode";

interface PincodeSelectorProps {
    onPincodeChange?: (pincode: string) => void;
}

export function getStoredPincode(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(PINCODE_STORAGE_KEY) || "";
}

export default function PincodeSelector({ onPincodeChange }: PincodeSelectorProps) {
    const [pincode, setPincode] = useState(() => getStoredPincode());
    const [isEditing, setIsEditing] = useState(false);
    const [tempPincode, setTempPincode] = useState(pincode);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        const cleaned = tempPincode.replace(/\D/g, "").slice(0, 6);
        if (cleaned.length === 6) {
            setPincode(cleaned);
            localStorage.setItem(PINCODE_STORAGE_KEY, cleaned);
            onPincodeChange?.(cleaned);
            setIsEditing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
            setTempPincode(pincode);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm border border-neutral-200">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-500 flex-shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={tempPincode}
                    onChange={(e) => setTempPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    placeholder="Pincode"
                    className="w-16 text-[10px] font-medium text-neutral-800 bg-transparent border-none outline-none placeholder:text-neutral-400"
                />
            </div>
        );
    }

    return (
        <button
            onClick={() => {
                setTempPincode(pincode);
                setIsEditing(true);
            }}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-2 py-1 transition-colors"
        >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-700 flex-shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="text-[10px] font-medium text-neutral-700">
                {pincode || "Set Pincode"}
            </span>
        </button>
    );
}
