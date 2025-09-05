import React from 'react';

const LevelTracker = ({ 
  currentLevel, 
  maxLevel,
  successfulCommands,
  requiredCommandsToLevelUp,
  onLevelUp 
}) => {
  // Calculate progress percentage
  const progressPercentage = Math.min(
    Math.floor((successfulCommands / requiredCommandsToLevelUp) * 100),
    100
  );

  // Determine if level up is available
  const canLevelUp = currentLevel < maxLevel && successfulCommands >= requiredCommandsToLevelUp;

  return (
    <div className="level-tracker bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Level Progress</h3>
        <div className="text-2xl font-bold text-indigo-600">Level {currentLevel}</div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
        <div 
          className="bg-indigo-600 h-6 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        >
          <span className="flex justify-center items-center h-full text-xs text-white font-semibold">
            {progressPercentage}%
          </span>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        {successfulCommands} / {requiredCommandsToLevelUp} successful commands
        {canLevelUp && <span className="ml-2 text-green-600 font-semibold">Ready to level up!</span>}
      </div>

      {/* Level up button */}
      <button 
        onClick={onLevelUp}
        disabled={!canLevelUp}
        className={`w-full px-4 py-2 rounded font-semibold transition-colors ${
          canLevelUp 
            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {canLevelUp ? 'Level Up!' : `Complete ${requiredCommandsToLevelUp - successfulCommands} more commands`}
      </button>

      {/* Level badges */}
      <div className="mt-4 flex justify-center space-x-2">
        {[...Array(maxLevel)].map((_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i + 1 <= currentLevel
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
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
