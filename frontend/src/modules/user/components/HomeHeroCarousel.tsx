import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Slide {
    id: number;
    image: string;
    heading: string;
    subheading: string;
    cta: string;
    link: string;
}

const slides: Slide[] = [
    {
        id: 1,
        image: '/assets/hero/fresh_veg.png',
        heading: 'Fresh Vegetables Sale',
        subheading: 'Get up to 40% OFF on organic farm-fresh vegetables delivered to your door.',
        cta: 'Shop Now',
        link: '/category/vegetables'
    },
    {
        id: 2,
        image: '/assets/hero/instant_delivery.png',
        heading: 'Instant Grocery Delivery',
        subheading: 'Need it now? We deliver your daily essentials in just 10 minutes.',
        cta: 'Order Fast',
        link: '/category/grocery'
    },
    {
        id: 3,
        image: '/assets/hero/weekend_mega.png',
        heading: 'Weekend Mega Discount',
        subheading: 'Huge savings on your favorite snacks and household essentials this weekend.',
        cta: 'Grab Deals',
        link: '/category/snacks'
    },
    {
        id: 4,
        image: '/assets/hero/healthy_fruits.png',
        heading: 'Healthy Fruits Collection',
        subheading: 'Premium selection of exotic and local fruits for a healthier lifestyle.',
        cta: 'Explore More',
        link: '/category/fruits'
    },
    {
        id: 5,
        image: '/assets/hero/daily_essentials.png',
        heading: 'Daily Essentials',
        subheading: 'Start your day right with fresh milk, bread, and eggs at unbeatable prices.',
        cta: 'Stock Up',
        link: '/category/dairy'
    },
    {
        id: 6,
        image: '/assets/hero/special_combo.png',
        heading: 'Special Combo Offers',
        subheading: 'Perfect party platters and grocery combos curated just for you.',
        cta: 'View Offers',
        link: '/category/combos'
    }
];

const HomeHeroCarousel: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [direction, setDirection] = useState(0);

    const nextSlide = useCallback(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, []);

    const prevSlide = useCallback(() => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    }, []);

    useEffect(() => {
        if (isHovered) return;
        const timer = setInterval(nextSlide, 3000);
        return () => clearInterval(timer);
    }, [nextSlide, isHovered]);

    const slideVariants = {
        initial: (dir: number) => ({
            opacity: 0,
            scale: 1.1,
            x: dir > 0 ? 100 : -100,
        }),
        animate: {
            opacity: 1,
            scale: 1,
            x: 0,
            transition: {
                duration: 0.8,
                ease: [0.4, 0, 0.2, 1],
            },
        },
        exit: (dir: number) => ({
            opacity: 0,
            scale: 0.9,
            x: dir > 0 ? -100 : 100,
            transition: {
                duration: 0.6,
                ease: [0.4, 0, 0.2, 1],
            },
        }),
    };

    return (
        <div
            className="relative w-full h-[180px] md:h-[260px] overflow-hidden group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute inset-0 w-full h-full"
                >
                    {/* Image with Lazy Loading Support */}
                    <img
                        src={slides[currentIndex].image}
                        alt={slides[currentIndex].heading}
                        className="w-full h-full object-cover select-none"
                        loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent md:bg-gradient-to-r md:from-black/70 md:via-black/30 md:to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end md:justify-center p-6 md:p-12 lg:p-16 text-white max-w-4xl">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="text-2xl md:text-5xl font-extrabold mb-2 md:mb-4 tracking-tight leading-tight"
                        >
                            {slides[currentIndex].heading}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="text-sm md:text-xl text-neutral-200 mb-6 md:mb-8 line-clamp-2 md:line-clamp-none max-w-2xl font-medium"
                        >
                            {slides[currentIndex].subheading}
                        </motion.p>
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-fit px-6 py-2.5 bg-white text-black rounded-full font-bold text-[13px] md:text-sm shadow-lg hover:bg-neutral-100 transition-colors"
                            onClick={() => window.location.href = slides[currentIndex].link}
                        >
                            {slides[currentIndex].cta}
                        </motion.button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 z-20"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/20 z-20"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            setDirection(index > currentIndex ? 1 : -1);
                            setCurrentIndex(index);
                        }}
                        className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ${index === currentIndex
                            ? 'w-8 md:w-10 bg-white'
                            : 'w-2 bg-white/40 hover:bg-white/60'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HomeHeroCarousel;
