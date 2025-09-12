import React, { useState, useEffect } from 'react';
import ConfettiExplosion from './ConfettiExplosion';

const LevelUpCelebration = ({ level, onComplete }) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [showFlash, setShowFlash] = useState(true);

  useEffect(() => {
    // Remove flash effect after 1 second
    const flashTimer = setTimeout(() => {
      setShowFlash(false);
    }, 1000);

    // Complete celebration after 3 seconds
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <>
      {/* Screen flash effect */}
      {showFlash && (
        <div className="level-up-flash" />
      )}

      {/* Confetti explosion */}
      {showConfetti && (
        <ConfettiExplosion onComplete={() => setShowConfetti(false)} />
      )}

      {/* Level up message */}
      <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
        <div className="bg-white rounded-lg shadow-2xl p-8 text-center border-4 border-yellow-400 fade-in-scale">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold text-gray-800 mb-2">
            Level Up!
          </h2>
          <p className="text-xl text-gray-600 mb-4">
            Congratulations! You've reached Level {level}!
          </p>
          <div className="flex justify-center space-x-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-8 h-8 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-8 h-8 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LevelUpCelebration;