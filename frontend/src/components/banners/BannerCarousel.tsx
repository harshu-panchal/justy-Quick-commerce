import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BannerMode } from "./banner.types";
import { useBanners } from "./useBanners";
import BannerCard from "./BannerCard";

interface BannerCarouselProps {
    mode: BannerMode;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ mode }) => {
    const { banners, loading } = useBanners(mode);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0); // -1 for left, 1 for right
    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const nextSlide = useCallback(() => {
        if (banners.length <= 1) return;
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, [banners.length]);

    const prevSlide = useCallback(() => {
        if (banners.length <= 1) return;
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }, [banners.length]);

    useEffect(() => {
        if (isHovered || banners.length <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(nextSlide, 5000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [nextSlide, isHovered, banners.length]);

    // Reset index when mode changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [mode]);

    if (loading || banners.length === 0) {
        return (
            <div className="w-full h-[160px] md:h-[240px] animate-pulse bg-neutral-100 rounded-2xl md:rounded-3xl border border-neutral-200" />
        );
    }

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? "100%" : "-100%",
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? "100%" : "-100%",
            opacity: 0,
            scale: 0.95
        })
    };

    return (
        <div
            className="relative w-full h-[160px] md:h-[240px] overflow-hidden group px-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative w-full h-full">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={banners[currentIndex].id}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.3 }
                        }}
                        className="absolute inset-0"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 500;
                            if (swipe && offset.x > 0) prevSlide();
                            else if (swipe && offset.x < 0) nextSlide();
                        }}
                    >
                        <div className="px-4 md:px-6 lg:px-8 h-full">
                            <BannerCard banner={banners[currentIndex]} />
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Arrows - Only visible on hover and if multiple banners */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                        className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/30 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-white/50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                        className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/30 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-white/50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}

            {/* Indicators */}
            {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setDirection(index > currentIndex ? 1 : -1);
                                setCurrentIndex(index);
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default BannerCarousel;
