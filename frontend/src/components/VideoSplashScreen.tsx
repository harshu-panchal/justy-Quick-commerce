import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoSplashScreenProps {
  onComplete: () => void;
}

const VideoSplashScreen: React.FC<VideoSplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onComplete, 800); 
  };

  const handlePlayWithSound = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsBlocked(false);
      }).catch(err => console.error("Play failed after interaction:", err));
    }
  };

  const handleVideoEnd = () => {
    setIsVisible(false);
    setTimeout(onComplete, 800);
  };

  useEffect(() => {
    const hasShown = sessionStorage.getItem('videoSplashShown');
    if (hasShown) {
      onComplete();
      setIsVisible(false);
      return;
    }

    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Unmuted auto-play blocked by browser. Showing play overlay.", error);
        setIsBlocked(true);
      });
    }

    sessionStorage.setItem('videoSplashShown', 'true');
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <video
            ref={videoRef}
            src="/videos/splash.mp4"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            autoPlay
            playsInline
            onEnded={handleVideoEnd}
          />
          
          {isBlocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100001,
                cursor: 'pointer'
              }}
              onClick={handlePlayWithSound}
            >
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  border: '2px solid #fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  marginInline: 'auto'
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="#fff">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold' }}>Tap to Play with Sound</h3>
              </div>
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            onClick={handleSkip}
            style={{
              position: 'absolute',
              top: '40px',
              right: '20px',
              padding: '10px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              zIndex: 100005,
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
            whileTap={{ scale: 0.95 }}
          >
            Skip
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
          </motion.button>

          {/* Optional: Add a subtle overlay to match the app branding if needed */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, transparent 80%, rgba(0,0,0,0.4))',
            pointerEvents: 'none'
          }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoSplashScreen;
