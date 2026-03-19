import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FlyingCoins from './FlyingCoins';
import { useCoins } from '../context/CoinContext';

interface Reward {
  id: string;
  label: string;
  value: number;
  icon?: string; 
  color: string;
  type: 'coin' | 'discount';
  probability?: number;
}

const DEFAULT_REWARDS: Reward[] = [
  { id: '1', label: '50 Coins', value: 50, icon: '💰', color: '#FEF3C7', type: 'coin' },
  { id: '2', label: '10 Coins', value: 10, icon: '🪙', color: '#FDE68A', type: 'coin' },
  { id: '3', label: '20 Coins', value: 20, icon: '🪙', color: '#FEF3C7', type: 'coin' },
  { id: '4', label: '5 Coins', value: 5, icon: '🪙', color: '#FDE68A', type: 'coin' },
  { id: '5', label: '30 Coins', value: 30, icon: '💰', color: '#FEF3C7', type: 'coin' },
  { id: '6', label: '10 Coins', value: 10, icon: '🪙', color: '#FDE68A', type: 'coin' },
  { id: '7', label: '20 Coins', value: 20, icon: '🪙', color: '#FEF3C7', type: 'coin' },
  { id: '8', label: '5 Coins', value: 5, icon: '🪙', color: '#FDE68A', type: 'coin' },
];

interface LuckySpinProps {
  isOpen: boolean;
  onClose: () => void;
  autoOpened?: boolean;
  config?: {
    enabled: boolean;
    trigger: string;
    frequency: string;
    rewards: Reward[];
  } | null;
}

const LuckySpin: React.FC<LuckySpinProps> = ({ isOpen, onClose, autoOpened, config: externalConfig }) => {
  const { addCoins } = useCoins();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>(DEFAULT_REWARDS);
  const [config, setConfig] = useState<any>(externalConfig || null);
  const [result, setResult] = useState<Reward | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (externalConfig) {
        setConfig(externalConfig);
        if (externalConfig.rewards && externalConfig.rewards.length > 0) {
          setRewards(externalConfig.rewards);
        } else {
          setRewards(DEFAULT_REWARDS);
        }
      } else {
        const savedConfig = localStorage.getItem('spinnerConfig');
        if (savedConfig) {
          try {
            const parsed = JSON.parse(savedConfig);
            setConfig(parsed);
            if (parsed.rewards && parsed.rewards.length > 0) {
              setRewards(parsed.rewards);
            } else {
              setRewards(DEFAULT_REWARDS);
            }
          } catch (err) {
            console.error('Failed to parse spinner configuration', err);
            setRewards(DEFAULT_REWARDS);
          }
        } else {
          setRewards(DEFAULT_REWARDS);
        }
      }
    }
  }, [isOpen, externalConfig]);
  
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
    
    const segmentDegree = 360 / rewards.length;
    const randomExtra = Math.floor(Math.random() * rewards.length);
    const totalRotation = rotation + (360 * 6) + (randomExtra * segmentDegree);
    
    setRotation(totalRotation);

    const actualRotation = totalRotation % 360;
    const winningIndex = (rewards.length - Math.floor(actualRotation / segmentDegree)) % rewards.length;

    setTimeout(() => {
      setSpinning(false);
      const wonReward = rewards[winningIndex];
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
   <></>
  );
};

export default LuckySpin;
