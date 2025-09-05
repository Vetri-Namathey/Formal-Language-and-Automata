import React from 'react';

const FeedbackBox = ({ feedback }) => {
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
    <div className={`rounded-lg border-2 p-4 ${getColorClass()}`}>
      <div className="flex items-start space-x-3">
        <span className="text-2xl">{getIcon()}</span>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">Feedback</h3>
          <p className="mb-3">{feedback.message}</p>

          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <div>
              <p className="font-medium mb-2">Suggestions:</p>
              <ul className="list-disc list-inside space-y-1">
                {feedback.suggestions.map((s, i) => (
                  <li key={i} className="text-sm">{s}</li>
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
