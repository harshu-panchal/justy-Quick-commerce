import Lottie from 'lottie-react';
import noItemAnimation from '@assets/animation/No Item In Box.json';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    title?: string;
    description?: string;
    buttonText?: string;
    onButtonClick?: () => void;
}

export default function EmptyState({
    title = "No Items Found",
    description = "We couldn't find what you're looking for. Please try a different category or search term.",
    buttonText,
    onButtonClick
}: EmptyStateProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-2 pb-12 px-6 text-center"
        >
            <div className="w-64 h-64 md:w-80 md:h-80 mb-6 flex items-center justify-center">
                <Lottie
                    animationData={noItemAnimation}
                    loop={true}
                    className="w-full h-full"
                />
            </div>
            
            <h3 className="text-xl md:text-2xl font-bold text-neutral-900 mb-2">
                {title}
            </h3>
            
            <p className="text-neutral-500 text-sm md:text-base max-w-xs md:max-w-md mx-auto mb-8">
                {description}
            </p>
            
            {buttonText && onButtonClick && (
                <button
                    onClick={onButtonClick}
                    className="px-8 py-3 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-all shadow-md active:scale-95"
                >
                    {buttonText}
                </button>
            )}
        </motion.div>
    );
}
