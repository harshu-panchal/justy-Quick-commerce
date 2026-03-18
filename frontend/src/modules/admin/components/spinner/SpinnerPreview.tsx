import React from 'react';
import { motion } from 'framer-motion';
import { Reward } from './RewardForm';

interface SpinnerPreviewProps {
  rewards: Reward[];
}

const SpinnerPreview: React.FC<SpinnerPreviewProps> = ({ rewards }) => {
  const displayRewards = rewards.length > 0 ? rewards : [
    { id: '1', label: 'Reward 1', type: 'coin', value: 10, color: '#fef3c7' },
    { id: '2', label: 'Reward 2', type: 'coin', value: 20, color: '#fde68a' },
    { id: '3', label: 'Reward 3', type: 'coin', value: 30, color: '#fef3c7' },
    { id: '4', label: 'Reward 4', type: 'coin', value: 40, color: '#fde68a' },
  ];

  return (
    <div className="flex flex-col items-center bg-neutral-900/5 p-6 rounded-2xl border border-neutral-200">
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 select-none">
        
        {/* Wooden Outer Rim */}
        <div className="absolute inset-0 rounded-full border-[10px] border-[#8B4513] shadow-lg flex items-center justify-center bg-[#5D2E0A] p-0.5">
          
          {/* Lights on Rim */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full shadow-[0_0_5px_white] ${i % 2 === 0 ? 'bg-yellow-100' : 'bg-yellow-300'}`}
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 30}deg) translateY(-118px) translateX(-50%)`,
              }}
            />
          ))}

          {/* Pointer */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30">
            <svg viewBox="0 0 100 130" className="w-8 h-10 drop-shadow-md">
              <path 
                d="M10 40 C10 15 90 15 90 40 L90 60 L50 115 L10 60 Z" 
                fill="#FBC02D" 
                stroke="#FF8F00" 
                strokeWidth="3"
              />
            </svg>
          </div>

          {/* Inner Wheel */}
          <div className="w-full h-full rounded-full border-2 border-[#3D1E07] relative overflow-hidden bg-white">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {displayRewards.map((reward, i) => {
                const angle = (360 / displayRewards.length) * i;
                const endAngle = (360 / displayRewards.length) * (i + 1);
                const x1 = 50 + 50 * Math.cos((Math.PI * angle) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * angle) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
                
                return (
                  <g key={reward.id}>
                    <path
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                      fill={reward.color || (i % 2 === 0 ? '#FEF3C7' : '#FDE68A')}
                      stroke="#8B4513"
                      strokeWidth="0.5"
                    />
                    <g transform={`rotate(${angle + 360 / displayRewards.length / 2}, 50, 50)`}>
                       <text
                          x="75"
                          y="50"
                          fill="#5D2E0A"
                          fontSize="5"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(90, 75, 50)`}
                        >
                          {reward.label}
                        </text>
                    </g>
                  </g>
                );
              })}
            </svg>
            
            {/* Hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#8B4513] rounded-full border-2 border-[#3D1E07] flex items-center justify-center z-10 shadow-md">
               <span className="text-[8px] font-black text-white/90 uppercase tracking-tighter">PREVIEW</span>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-8 text-neutral-500 text-sm font-medium italic">
        * This is a static visual preview of how the wheel will look.
      </p>
    </div>
  );
};

export default SpinnerPreview;
