import React from 'react';

const Badge = ({ badge }) => {
  if (!badge) return null;
  return (
    <div className="badge flex items-center space-x-2 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded px-3 py-1">
      <div className="text-lg">🏅</div>
      <div>
        <div className="font-semibold text-sm">{badge.title}</div>
        <div className="text-xs text-yellow-700">{badge.description}</div>
      </div>
    </div>
  );
};

export default Badge;
