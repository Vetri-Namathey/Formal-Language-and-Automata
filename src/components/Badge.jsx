import React, { useState, useEffect } from 'react';

const Badge = ({ badge, isNew = false }) => {
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isNew) {
      // New badge gets popup animation
      setAnimationClass('badge-popup badge-glow');
      
      // Remove glow after animation completes
      setTimeout(() => {
        setAnimationClass('');
      }, 3000);
    }
  }, [isNew]);

  if (!badge) return null;
  
  return (
    <div className={`badge flex items-center space-x-2 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded px-3 py-1 transition-all duration-300 hover:bg-yellow-200 hover:scale-105 ${animationClass}`}>
      <div className="text-lg">🏅</div>
      <div>
        <div className="font-semibold text-sm">{badge.title}</div>
        <div className="text-xs text-yellow-700">{badge.description}</div>
      </div>
    </div>
  );
};

export default Badge;
