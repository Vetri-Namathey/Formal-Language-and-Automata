import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LevelTracker = ({ 
  currentLevel, 
  maxLevel,
  successfulCommands,
  requiredCommandsToLevelUp,
  onLevelUp 
}) => {
  const { t } = useTranslation();
  const [previousProgress, setPreviousProgress] = useState(0);
  const [animateProgress, setAnimateProgress] = useState(false);

  // Calculate progress percentage
  const progressPercentage = Math.min(
    Math.floor((successfulCommands / requiredCommandsToLevelUp) * 100),
    100
  );

  // Determine if we reached the maximum level cap
  const atCap = currentLevel >= maxLevel;
  // Determine if level up is available (not at cap and progress met)
  const canLevelUp = !atCap && successfulCommands >= requiredCommandsToLevelUp;

  // Animate progress bar when it changes
  useEffect(() => {
    if (progressPercentage > previousProgress) {
      setAnimateProgress(true);
      setTimeout(() => setAnimateProgress(false), 1000);
    }
    setPreviousProgress(progressPercentage);
  }, [progressPercentage, previousProgress]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 card-hover">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{t('level')} {currentLevel}</h3>
        <span className="text-sm text-gray-500">
          {t('level')} {currentLevel} / {maxLevel}
        </span>
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
        {t('levelTracker.successfulCommandsLabel', { success: successfulCommands, required: requiredCommandsToLevelUp })}
        {canLevelUp && (
          <span className="ml-2 text-green-600 font-semibold animate-pulse">
            {t('levelTracker.readyToLevelUp')}
          </span>
        )}
      </div>

      {/* Level up button */}
      <button 
        onClick={onLevelUp}
        disabled={atCap || !canLevelUp}
        className={`w-full px-4 py-2 rounded font-semibold transition-all duration-300 btn-hover ${
          canLevelUp 
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 ripple-effect' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {atCap
          ? t('trainingComplete.title')
          : canLevelUp 
            ? t('levelTracker.levelUpButton') 
            : t('levelTracker.completeMoreCommands', { remaining: Math.max(requiredCommandsToLevelUp - successfulCommands, 0) })}
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
            title={`${t('level')} ${i + 1}${i + 1 <= currentLevel ? ` (${t('levelTracker.unlocked')})` : ` (${t('levelTracker.locked')})`}`}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LevelTracker;
