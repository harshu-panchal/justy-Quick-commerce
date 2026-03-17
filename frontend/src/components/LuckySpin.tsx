import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FlyingCoins from './FlyingCoins';
import { useCoins } from '../context/CoinContext';

interface Reward {
  label: string;
  value: number;
  icon: string; // Emoji representing the coin stack size
}

const REWARDS: Reward[] = [
  { label: '50 Coins', value: 50, icon: '💰' },
  { label: '10 Coins', value: 10, icon: '🪙' },
  { label: '20 Coins', value: 20, icon: '🪙' },
  { label: '5 Coins', value: 5, icon: '🪙' },
  { label: '30 Coins', value: 30, icon: '💰' },
  { label: '10 Coins', value: 10, icon: '🪙' },
  { label: '20 Coins', value: 20, icon: '🪙' },
  { label: '5 Coins', value: 5, icon: '🪙' },
];

interface LuckySpinProps {
  isOpen: boolean;
  onClose: () => void;
  autoOpened?: boolean;
}

const LuckySpin: React.FC<LuckySpinProps> = ({ isOpen, onClose, autoOpened }) => {
  const { addCoins } = useCoins();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Reward | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  
  // Animation state
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [showFloatingText, setShowFloatingText] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [endPos, setEndPos] = useState({ x: 0, y: 0 });
  const collectBtnRef = useRef<HTMLButtonElement>(null);

  const handleCollect = () => {
    // 1. Calculate positions
    const btnRect = collectBtnRef.current?.getBoundingClientRect();
    const walletElement = document.getElementById('wallet-balance-header');
    const walletRect = walletElement?.getBoundingClientRect();

    if (btnRect && walletRect) {
      setStartPos({
        x: btnRect.left + btnRect.width / 2,
        y: btnRect.top + btnRect.height / 2
      });
      setEndPos({
        x: walletRect.left + walletRect.width / 2,
        y: walletRect.top + walletRect.height / 2
      });
      
      // 2. Start animation
      setShowCoinAnimation(true);
      
      // 3. Add bounce effect and floating text after coins "travel"
      setTimeout(() => {
        walletElement?.classList.add('animate-bounce');
        setShowFloatingText(true);
        if (result) addCoins(result.value, 'Won from Lucky Spin');
        
        // Remove bounce after a bit
        setTimeout(() => walletElement?.classList.remove('animate-bounce'), 1000);
      }, 1000);
      
      // 4. Close modal and reset state after full animation cycle
      setTimeout(() => {
        setShowResultModal(false);
        setShowFloatingText(false);
        onClose();
      }, 2500);
    } else {
      // Fallback if elements not found
      setShowResultModal(false);
      onClose();
    }
  };

  const spinWheel = () => {
    if (spinning) return;

    setSpinning(true);
    setResult(null);
    
    const segmentDegree = 360 / REWARDS.length;
    const randomExtra = Math.floor(Math.random() * REWARDS.length);
    const totalRotation = rotation + (360 * 6) + (randomExtra * segmentDegree);
    
    setRotation(totalRotation);

    const actualRotation = totalRotation % 360;
    const winningIndex = (REWARDS.length - Math.floor(actualRotation / segmentDegree)) % REWARDS.length;

    setTimeout(() => {
      setSpinning(false);
      const wonReward = REWARDS[winningIndex];
      setResult(wonReward);
      setShowResultModal(true);
      
      localStorage.setItem('lastSpinReward', JSON.stringify({
        ...wonReward,
        timestamp: new Date().getTime()
      }));

      if (autoOpened) {
        sessionStorage.setItem('spin_session_shown', 'true');
      }
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/70 backdrop-blur-md font-sans">
        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="relative w-full max-w-sm flex flex-col items-center"
        >
          {/* Close Button */}
          {!spinning && (
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors border border-white/20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Wooden Outer Rim with Lights */}
          <div className="relative w-full aspect-square rounded-full border-[14px] border-[#8B4513] shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(0,0,0,0.5)] bg-[#5D2E0A] p-1 flex items-center justify-center">
            
            {/* Lights on Rim */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-3 h-3 rounded-full shadow-[0_0_10px_white] ${i % 2 === 0 ? 'bg-yellow-100' : 'bg-yellow-300'}`}
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 30}deg) translateY(-165px) translateX(-50%)`,
                }}
              />
            ))}

            {/* Pointer (3D Yellow Arrow) */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
              <div className="relative w-12 h-16 filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                {/* 3D Arrow Shape using SVG */}
                <svg viewBox="0 0 100 130" className="w-full h-full drop-shadow-xl">
                  {/* Outer Glow/Shadow */}
                  <defs>
                    <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFF176" />
                      <stop offset="50%" stopColor="#FBC02D" />
                      <stop offset="100%" stopColor="#F57F17" />
                    </linearGradient>
                    <filter id="innerShadow">
                      <feOffset dx="0" dy="2" />
                      <feGaussianBlur stdDeviation="1.5" result="offset-blur" />
                      <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                      <feFlood floodColor="black" floodOpacity="0.4" result="color" />
                      <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                      <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                    </filter>
                  </defs>
                  
                  {/* Main Arrow Body */}
                  <path 
                    d="M10 40 C10 15 90 15 90 40 L90 60 L50 115 L10 60 Z" 
                    fill="url(#arrowGradient)" 
                    stroke="#FF8F00" 
                    strokeWidth="3"
                  />
                  
                  {/* 3D Glassy Bulb/Button at top */}
                  <circle cx="50" cy="40" r="12" fill="#FFE082" filter="url(#innerShadow)" />
                  <circle cx="50" cy="38" r="8" fill="white" fillOpacity="0.4" />
                </svg>
              </div>
            </div>

            {/* Inner Wheel (Rotating part) */}
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.3, 0, 0.2, 1] }}
              className="w-full h-full rounded-full border-4 border-[#3D1E07] relative overflow-hidden shadow-2xl"
              style={{ background: '#F5DEB3' }} // Wheat color for cream segments
            >
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {REWARDS.map((reward, i) => {
                  const angle = (360 / REWARDS.length) * i;
                  const endAngle = (360 / REWARDS.length) * (i + 1);
                  const x1 = 50 + 50 * Math.cos((Math.PI * angle) / 180);
                  const y1 = 50 + 50 * Math.sin((Math.PI * angle) / 180);
                  const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                  const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
                  
                  return (
                    <g key={i}>
                      <path
                        d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                        fill={i % 2 === 0 ? '#FEF3C7' : '#FDE68A'} // Alternating beige shades
                        stroke="#8B4513"
                        strokeWidth="0.8"
                      />
                      <g transform={`rotate(${angle + 360 / REWARDS.length / 2}, 50, 50)`}>
                         {/* Value - Closer to center */}
                         <text
                            x="68"
                            y="50"
                            fill="#5D2E0A"
                            fontSize="7"
                            fontWeight="900"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(90, 68, 50)`}
                          >
                            {reward.value}
                          </text>
                          {/* Icon - Closer to edge */}
                          <text
                            x="84"
                            y="50"
                            fontSize="8"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(90, 84, 50)`}
                          >
                            {reward.icon}
                          </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
              
              {/* Central Wooden Hub (Clickable) */}
              <button 
                onClick={spinWheel}
                disabled={spinning}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#8B4513] rounded-full border-4 border-[#3D1E07] shadow-xl flex items-center justify-center z-10 group/hub transition-transform active:scale-95 disabled:scale-100"
              >
                 <div className="w-14 h-14 bg-gradient-to-tr from-[#5D2E0A] to-[#8B4513] rounded-full flex items-center justify-center border-2 border-orange-200/20 group-hover/hub:brightness-110 transition-all">
                    <span className="text-xs font-black text-white/90 uppercase tracking-tighter drop-shadow-md">SPIN</span>
                 </div>
              </button>
            </motion.div>
          </div>

          {/* Green "SPIN!" Button style from image (used as Spin trigger) */}
          <div className="mt-12 w-full px-8">
            <motion.button
              whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.95 }}
              disabled={spinning}
              onClick={spinWheel}
              className={`w-full py-4 rounded-full font-black text-2xl uppercase tracking-tighter shadow-[0_8px_0_#166534,0_15px_30px_rgba(0,0,0,0.3)] border-4 border-white transition-all overflow-hidden relative group ${
                spinning 
                ? 'bg-gray-400 shadow-[0_5px_0_#4a5568] cursor-not-allowed opacity-80' 
                : 'bg-gradient-to-b from-[#4ADE80] to-[#16A34A] text-white'
              }`}
            >
              {/* Glossy Reflection */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 skew-x-[-20deg] transform -translate-x-4"></div>
              
              <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                {spinning ? 'Good Luck!' : 'SPIN!'}
              </span>
            </motion.button>
          </div>
          
          <p className="mt-6 text-white/60 font-medium text-sm tracking-wide bg-white/5 py-1 px-4 rounded-full border border-white/10 uppercase">
             Spin the lucky wheel
          </p>
        </motion.div>

        {/* Improved Winning Modal */}
        <AnimatePresence>
          {showResultModal && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.5, y: 50, rotate: -5 }}
                animate={{ scale: 1, y: 0, rotate: 0 }}
                className="bg-[#FEF3C7] border-[10px] border-[#8B4513] rounded-[40px] p-10 max-w-xs w-full text-center shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative"
              >
                {/* Decorative border */}
                <div className="absolute inset-2 border-4 border-[#8B4513]/20 rounded-[30px] pointer-events-none"></div>

                <div className="text-8xl mb-6 filter drop-shadow-2xl animate-bounce">{result.icon}</div>
                <h3 className="text-3xl font-black text-[#5D2E0A] mb-2 uppercase tracking-tight">Marvelous!</h3>
                <p className="text-[#8B4513] font-bold text-lg mb-8 leading-tight">
                  You uncovered <span className="text-2xl text-[#16A34A]">{result.label}</span>!
                </p>
                <button
                  ref={collectBtnRef}
                  onClick={handleCollect}
                  className="w-full py-4 bg-gradient-to-b from-[#FCD34D] to-[#D97706] text-[#5D2E0A] rounded-2xl font-black text-xl shadow-[0_6px_0_#92400E] border-2 border-white/50 hover:brightness-110 active:shadow-none active:translate-y-1 transition-all"
                >
                  COLLECT!
                </button>
              </motion.div>
              
              {/* Better Confetti Effect */}
              <div className="pointer-events-none fixed inset-0 overflow-hidden">
                   {[...Array(40)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-4 sm:w-3 sm:h-6 rounded-sm"
                        style={{ 
                            backgroundColor: ['#FCD34D', '#F97316', '#DC2626', '#10B981', '#3B82F6'][i % 5],
                            left: `${Math.random() * 100}%`,
                            top: `-20px`
                        }}
                        animate={{ 
                            top: '120vh',
                            left: `${(Math.random() - 0.5) * 20 + i}%`,
                            rotate: 720 
                        }}
                        transition={{ 
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 2
                        }}
                    />
                   ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flying Coins Animation */}
        {showCoinAnimation && (
          <FlyingCoins 
            startPosition={startPos}
            endPosition={endPos}
            onComplete={() => setShowCoinAnimation(false)}
          />
        )}

        {/* Floating "+N Coins" Text */}
        <AnimatePresence>
          {showFloatingText && result && (
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -40 }}
              exit={{ opacity: 0 }}
              className="fixed z-[110] pointer-events-none font-black text-xl text-yellow-400 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] flex items-center gap-1"
              style={{
                left: endPos.x,
                top: endPos.y,
                transform: 'translateX(-50%)'
              }}
            >
              +{result.value} <span className="text-2xl">🪙</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};

export default LuckySpin;
