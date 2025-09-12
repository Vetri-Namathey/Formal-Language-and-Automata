import React, { useState, useEffect } from 'react';

const LevelTracker = ({ 
  currentLevel, 
  maxLevel,
  successfulCommands,
  requiredCommandsToLevelUp,
  onLevelUp 
}) => {
  const [previousProgress, setPreviousProgress] = useState(0);
  const [animateProgress, setAnimateProgress] = useState(false);

  // Calculate progress percentage
  const progressPercentage = Math.min(
    Math.floor((successfulCommands / requiredCommandsToLevelUp) * 100),
    100
  );

  // Determine if level up is available
  const canLevelUp = currentLevel < maxLevel && successfulCommands >= requiredCommandsToLevelUp;

  // Animate progress bar when it changes
  useEffect(() => {
    if (progressPercentage > previousProgress) {
      setAnimateProgress(true);
      setTimeout(() => setAnimateProgress(false), 1000);
    }
    setPreviousProgress(progressPercentage);
  }, [progressPercentage, previousProgress]);

  return (
    <div className="level-tracker bg-white rounded-lg shadow-md p-4 card-hover">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Level Progress</h3>
        <div className="text-2xl font-bold text-indigo-600">Level {currentLevel}</div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-6 mb-4 overflow-hidden">
        <div 
          className={`bg-indigo-600 h-6 rounded-full transition-all duration-500 ease-out flex items-center justify-center relative ${
            animateProgress ? 'progress-fill-animated' : ''
          } ${canLevelUp ? 'pulse-success' : ''}`}
          style={{ 
            width: `${progressPercentage}%`,
            '--target-width': `${progressPercentage}%`
          }}
        >
          <span className="text-xs text-white font-semibold">
            {progressPercentage}%
          </span>
          
          {/* Progress shine effect */}
          {animateProgress && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-slow"
                 style={{
                   animation: 'progress-shine 1s ease-out',
                   backgroundSize: '200% 100%'
                 }}>
            </div>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        {successfulCommands} / {requiredCommandsToLevelUp} successful commands
        {canLevelUp && (
          <span className="ml-2 text-green-600 font-semibold animate-pulse">
            🚀 Ready to level up!
          </span>
        )}
      </div>

      {/* Level up button */}
      <button 
        onClick={onLevelUp}
        disabled={!canLevelUp}
        className={`w-full px-4 py-2 rounded font-semibold transition-all duration-300 btn-hover ${
          canLevelUp 
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 ripple-effect' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {canLevelUp ? '🎉 Level Up!' : `Complete ${requiredCommandsToLevelUp - successfulCommands} more commands`}
      </button>

      {/* Level badges */}
      <div className="mt-4 flex justify-center space-x-2">
        {[...Array(maxLevel)].map((_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 transform hover:scale-110 ${
              i + 1 <= currentLevel
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
            } ${i + 1 === currentLevel ? 'ring-2 ring-indigo-300 ring-offset-2' : ''}`}
            title={`Level ${i + 1}${i + 1 <= currentLevel ? ' (Unlocked)' : ' (Locked)'}`}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LevelTracker;
