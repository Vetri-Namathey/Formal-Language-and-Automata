import React from 'react';

const ConfettiExplosion = ({ onComplete }) => {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8'];
  const confettiCount = 50;

  React.useEffect(() => {
    // Auto-remove after animation completes
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(confettiCount)].map((_, i) => {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const randomDelay = Math.random() * 0.5;
        const randomX = Math.random() * 100;
        const randomY = Math.random() * 100;
        const randomRotation = Math.random() * 360;
        const randomScale = 0.5 + Math.random() * 0.5;

        return (
          <div
            key={i}
            className="confetti-particle"
            style={{
              backgroundColor: randomColor,
              left: `${randomX}%`,
              top: `${randomY}%`,
              animationDelay: `${randomDelay}s`,
              transform: `rotate(${randomRotation}deg) scale(${randomScale})`,
            }}
          />
        );
      })}
    </div>
  );
};

export default ConfettiExplosion;