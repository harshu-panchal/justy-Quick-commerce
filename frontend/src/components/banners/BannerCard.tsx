import React from "react";
import { Banner } from "./banner.types";
import { useNavigate } from "react-router-dom";
 
 interface BannerCardProps {
     banner: Banner;
 }
 
 const BannerCard: React.FC<BannerCardProps> = ({ banner }) => {
     const navigate = useNavigate();
 
     const handleClick = () => {
         if (!banner.linkType || banner.linkType === 'none' || !banner.linkValue) return;
 
         if (banner.linkType === 'category') {
             // Redirect to category page
             navigate(`/category/${banner.linkValue}`);
         } else if (banner.linkType === 'product') {
             // Redirect to product detail
             navigate(`/product/${banner.linkValue}`);
         } else if (banner.linkType === 'external') {
             // Open external link
             window.open(banner.linkValue, '_blank');
         }
     };
 
     return (
         <div
             onClick={handleClick}
             className="relative w-full h-full cursor-pointer overflow-hidden rounded-2xl md:rounded-3xl shadow-lg border border-neutral-100 transition-transform duration-300 hover:scale-[1.01]"
         >
            <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-full object-cover select-none"
                loading="lazy"
            />
            {/* Subtle Gradient for legibility if needed */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent hidden md:block" />

            <div className="absolute bottom-4 left-6 right-6 text-white hidden md:block">
                <h3 className="text-xl md:text-2xl font-bold tracking-tight drop-shadow-md">
                    {banner.title}
                </h3>
            </div>
        </div>
    );
};

export default BannerCard;
