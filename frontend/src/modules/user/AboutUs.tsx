import { useNavigate } from 'react-router-dom';

const stats = [
    { label: 'Products', value: '10K+', icon: '📦' },
    { label: 'Sellers', value: '500+', icon: '🏪' },
    { label: 'Happy Customers', value: '50K+', icon: '🤝' },
    { label: 'Support', value: '24/7', icon: '🕒' }
];

const features = [
    {
        title: 'Lightning Fast Delivery',
        description: 'Get your orders delivered at incredible speeds with our highly optimized logistics network.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" fillOpacity="0.2" />
            </svg>
        )
    },
    {
        title: 'Secure & Trusted Payments',
        description: 'Your security is our priority. We use industry-leading encryption for all your transactions.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.2" />
            </svg>
        )
    },
    {
        title: 'Uncompromising Quality',
        description: 'We partner only with verified sellers to ensure that every product you receive meets our high standards.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor" fillOpacity="0.2" />
            </svg>
        )
    },
    {
        title: 'Customer-First Support',
        description: 'Our dedicated team is always here to help you, no matter the time of day.',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor" fillOpacity="0.2" />
            </svg>
        )
    }
];

export default function AboutUs() {
    const navigate = useNavigate();

    return (
        <div className="pb-12 bg-neutral-50 min-h-screen font-sans">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-neutral-100">
                <div className="px-4 md:px-6 lg:px-8 py-3">
                    <div className="flex items-center gap-3 max-w-5xl mx-auto">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors"
                            aria-label="Back"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-bold text-neutral-900">About Jyasti</h1>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-8 pb-12 bg-white">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-60" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-60" />

                <div className="relative px-4 md:px-6 lg:px-8 max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 mb-6 shadow-xl shadow-teal-200">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" />
                        </svg>
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-neutral-900 mb-4 tracking-tight">
                        Building <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Trust</span> with Every Delivery
                    </h2>
                    
                    <p className="text-base text-neutral-600 max-w-xl mx-auto mb-6 leading-relaxed">
                        At Jyasti, we're not just delivering products; we're delivering promises. Our mission is to simplify commerce and empower local communities through technology.
                    </p>
                </div>
            </section>

            {/* Content Body */}
            <div className="px-4 md:px-6 lg:px-8 max-w-5xl mx-auto -mt-6 mb-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow text-center"
                        >
                            <span className="text-2xl mb-2 block">{stat.icon}</span>
                            <div className="text-2xl font-bold text-neutral-900 mb-0.5 tracking-tight">{stat.value}</div>
                            <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Our Story Section */}
                <div className="grid md:grid-cols-2 gap-8 items-center mb-16 bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-neutral-50">
                    <div>
                        <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold uppercase tracking-widest mb-4">
                            Our Story
                        </span>
                        <h3 className="text-2xl font-bold text-neutral-900 mb-4 leading-tight">
                            Revolutionizing Local Commerce
                        </h3>
                        <div className="space-y-3 text-neutral-600 text-sm leading-relaxed">
                            <p>
                                Founded with a vision to bridge the gap between local vendors and modern consumers, Jyasti was born out of a simple need: reliable, fast, and transparent delivery services that respect the value of time.
                            </p>
                            <p>
                                What started as a small initiative to help local grocery stores reach more customers has now evolved into a comprehensive e-commerce ecosystem. Today, we support hundreds of sellers across various categories, ensuring that quality products are just a tap away.
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="aspect-square rounded-[1.5rem] bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-6 border border-neutral-100">
                             <div className="text-8xl grayscale opacity-20">🚀</div>
                             <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-base font-medium text-teal-900 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-teal-100 shadow-lg">
                                    Quality Deliveries
                                </span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mb-16">
                    <div className="text-center mb-10">
                        <h3 className="text-2xl font-bold text-neutral-900 mb-3">The Jyasti Advantage</h3>
                        <p className="text-neutral-600 text-sm max-w-lg mx-auto">Learn why thousands of customers and sellers trust us every single day.</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm hover:border-teal-200 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                                    {feature.icon}
                                </div>
                                <h4 className="text-lg font-bold text-neutral-900 mb-2">{feature.title}</h4>
                                <p className="text-neutral-600 text-xs leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-12 text-center space-y-1">
                    <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">Version 1.0.0</p>
                    <p className="text-xs text-neutral-500">© 2026 Jyasti. All rights reserved.</p>
                </div>
                </div>
            </div>
    );
}
