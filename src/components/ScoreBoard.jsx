import React from 'react';
import Badge from './Badge.jsx';

const ScoreBoard = ({ score, streak, badges }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-2">Scoreboard</h3>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-3xl font-bold text-blue-600">{score}</div>
          <div className="text-sm text-gray-500">Score</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-green-600">{streak}</div>
          <div className="text-sm text-gray-500">Current Streak</div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Badges</h4>
        <div className="space-y-2">
          {badges && badges.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {badges.map((b, i) => (
                <Badge badge={b} key={b.id || i} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400">No badges yet. Earn badges by playing!</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreBoard;
