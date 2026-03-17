import React, { useEffect, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

interface FlyingCoinsProps {
  startPosition: Position;
  endPosition: Position;
  coinCount?: number;
  onComplete?: () => void;
}

interface Coin {
  id: number;
  delay: number;
  duration: number;
  rotation: number;
  scale: number;
  curve: number; // Offset for the curved path
}

const FlyingCoins: React.FC<FlyingCoinsProps> = ({
  startPosition,
  endPosition,
  coinCount = 12,
  onComplete,
}) => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [active, setActive] = useState(true);

  useEffect(() => {
    // Generate randomized coin data
    const newCoins = Array.from({ length: coinCount }).map((_, i) => ({
      id: i,
      delay: i * 0.05 + Math.random() * 0.1, // Staggered start
      duration: 0.8 + Math.random() * 0.4, // Random flight time
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      curve: (Math.random() - 0.5) * 150, // Amplitude of the curve
    }));
    setCoins(newCoins);

    // Trigger completion callback after the last coin finishes
    const totalDuration = (coinCount * 0.05 + 1.2 + 0.5) * 1000;
    const timer = setTimeout(() => {
      setActive(false);
      onComplete?.();
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [coinCount, onComplete]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="absolute"
          style={{
            left: startPosition.x,
            top: startPosition.y,
            animation: `fly-coin-${coin.id} ${coin.duration}s cubic-bezier(0.4, 0, 0.2, 1) ${coin.delay}s forwards`,
          }}
        >
          {/* Coin Element */}
          <div 
            className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-[0_0_10px_rgba(255,215,0,0.8)] flex items-center justify-center text-[12px] font-bold text-yellow-800"
            style={{
              transform: `rotate(${coin.rotation}deg) scale(${coin.scale})`,
              animation: `coin-spin ${coin.duration}s linear ${coin.delay}s infinite`,
            }}
          >
            🪙
          </div>

          <style>{`
            @keyframes fly-coin-${coin.id} {
              0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 0;
              }
              15% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1.2);
              }
              100% {
                left: ${endPosition.x}px;
                top: ${endPosition.y}px;
                transform: translate(-50%, -50%) scale(0.4);
                opacity: 0.5;
              }
            }

            @keyframes coin-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ))}
    </div>
  );
};

export default FlyingCoins;
