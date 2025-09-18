import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const FeedbackBox = ({ feedback, animationTrigger }) => {
  const { t } = useTranslation();
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (feedback) {
      // Trigger animation based on feedback type
      if (feedback.type === 'success') {
        setAnimationClass('success-glow slide-in-bottom');
      } else if (feedback.type === 'error') {
        setAnimationClass('shake error-pulse');
      } else {
        setAnimationClass('fade-in-scale');
      }
      
      // Clear animation after it completes
      setTimeout(() => {
        setAnimationClass('');
      }, 1000);
    }
  }, [feedback]);

  // Handle external animation trigger
  useEffect(() => {
    if (animationTrigger) {
      if (animationTrigger === 'success' && feedback?.type === 'success') {
        setAnimationClass('success-glow pulse-success');
      } else if (animationTrigger === 'error' && feedback?.type === 'error') {
        setAnimationClass('shake error-pulse');
      }
      
      // Clear animation after it completes
      setTimeout(() => {
        setAnimationClass('');
      }, 1000);
    }
  }, [animationTrigger, feedback]);

  if (!feedback) return null;

  const getColorClass = () => {
    switch (feedback.type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (feedback.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`rounded-lg border-2 p-4 transition-all duration-300 ${getColorClass()} ${animationClass}`}>
      <div className="flex items-start space-x-3">
        <span className="text-2xl">{getIcon()}</span>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">{t('feedback')}</h3>
          <p className="mb-3">{
            feedback.messageKey
              ? t(feedback.messageKey, feedback.params || {})
              : feedback.message
          }</p>

          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <div>
              <p className="font-medium mb-2">{t('suggestions')}</p>
              <ul className="list-disc list-inside space-y-1">
                {feedback.suggestions.map((s, i) => (
                  <li key={i} className="text-sm stagger-1" style={{animationDelay: `${i * 0.1}s`}}>
                    {typeof s === 'string' ? s : (s.key ? t(s.key, s.params || {}) : '')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackBox;
