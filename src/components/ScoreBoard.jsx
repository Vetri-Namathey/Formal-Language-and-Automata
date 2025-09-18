import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Badge from './Badge.jsx';

const ScoreBoard = ({ score, streak, badges, newBadgeIds = [] }) => {
  const { t } = useTranslation();
  const [previousScore, setPreviousScore] = useState(score);
  const [previousStreak, setPreviousStreak] = useState(streak);
  const [scoreAnimation, setScoreAnimation] = useState('');
  const [streakAnimation, setStreakAnimation] = useState('');
  const [floatingScores, setFloatingScores] = useState([]);

  // Track score changes for animations
  useEffect(() => {
    if (score > previousScore) {
      const scoreDiff = score - previousScore;
      
      // Trigger score animation
      setScoreAnimation('count-up pulse-success');
      
      // Create floating score text
      const floatingScore = {
        id: Date.now(),
        value: `+${scoreDiff}`,
        timestamp: Date.now()
      };
      
      setFloatingScores(prev => [...prev, floatingScore]);
      
      // Remove floating score after animation
      setTimeout(() => {
        setFloatingScores(prev => prev.filter(item => item.id !== floatingScore.id));
      }, 2000);
      
      // Clear score animation
      setTimeout(() => setScoreAnimation(''), 600);
    }
    setPreviousScore(score);
  }, [score, previousScore]);

  // Track streak changes for animations
  useEffect(() => {
    if (streak > previousStreak) {
      setStreakAnimation('count-up pulse-success');
      setTimeout(() => setStreakAnimation(''), 600);
    } else if (streak < previousStreak) {
      // Streak broken - add a subtle shake
      setStreakAnimation('shake');
      setTimeout(() => setStreakAnimation(''), 600);
    }
    setPreviousStreak(streak);
  }, [streak, previousStreak]);

  // Get streak display class based on value
  const getStreakClass = () => {
    if (streak >= 10) return 'text-purple-600'; // Epic streak
    if (streak >= 5) return 'text-orange-600';  // Great streak
    if (streak >= 3) return 'text-green-600';   // Good streak
    return 'text-green-600'; // Normal
  };

  // Get streak emoji based on value
  const getStreakEmoji = () => {
    if (streak >= 10) return '🔥💜'; // Epic
    if (streak >= 5) return '🔥🧡';  // Great
    if (streak >= 3) return '🔥';    // Good
    return '✨'; // Normal
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 card-hover relative overflow-hidden">
      <h3 className="text-lg font-semibold mb-2">{t('scoreboard')}</h3>
      
      {/* Floating Score Animations */}
      {floatingScores.map((floatingScore) => (
        <div
          key={floatingScore.id}
          className="floating-score"
          style={{
            top: '50%',
            left: '25%',
            fontSize: '1.5rem'
          }}
        >
          {floatingScore.value}
        </div>
      ))}
      
      <div className="flex items-center justify-between mb-3">
        <div className="relative">
          <div className={`text-3xl font-bold text-blue-600 transition-all duration-300 ${scoreAnimation}`}>
            {score}
          </div>
          <div className="text-sm text-gray-500">{t('score')}</div>
        </div>
        
        <div className="relative">
          <div className={`text-3xl font-bold ${getStreakClass()} transition-all duration-300 ${streakAnimation}`}>
            {streak} {streak > 0 && <span className="text-lg">{getStreakEmoji()}</span>}
          </div>
          <div className="text-sm text-gray-500">
            {streak >= 10 ? t('streakEpic') : 
             streak >= 5 ? t('streakGreat') : 
             streak >= 3 ? t('streakGood') : 
             t('streak')}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">{t('badges')}</h4>
        <div className="space-y-2">
          {badges && badges.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {badges.map((b, i) => (
                <Badge 
                  badge={b} 
                  key={b.id || i} 
                  isNew={newBadgeIds.includes(b.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400">{t('noBadges')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreBoard;
