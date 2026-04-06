import React, { useState } from "react";
import "./CategoryDisclaimer.css";

interface CategoryDisclaimerProps {
  disclaimer: string;
  label?: string;
  className?: string;
}

const CategoryDisclaimer: React.FC<CategoryDisclaimerProps> = ({
  disclaimer,
  label = "Before You Buy",
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!disclaimer) return null;

  // Only show "View More" if disclaimer is reasonably long
  const isLong = disclaimer.length > 150;

  return (
    <div className={`category-disclaimer ${className}`}>
      <div className="disclaimer-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="disclaimer-content">
        <span className="disclaimer-label">{label}</span>
        <p className={`disclaimer-text ${isLong && !isExpanded ? "clamped" : ""}`}>
          {disclaimer}
        </p>
        {isLong && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="show-more-btn"
          >
            {isExpanded ? (
              <>
                Show Less
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </>
            ) : (
              <>
                View More
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryDisclaimer;
