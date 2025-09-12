import React from 'react';

const CommandHistory = ({ history = [] }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 card-hover">
      <h3 className="text-lg font-semibold mb-3">Command History</h3>
      {history.length === 0 ? (
        <div className="text-sm text-gray-400">No commands yet.</div>
      ) : (
        <ul className="space-y-3 text-sm">
          {history.map((entry, idx) => (
            <li key={entry.timestamp + '-' + idx} className={`border rounded p-2 transition-all duration-300 hover:shadow-md hover:scale-102 slide-in-right ${idx === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{entry.command}</div>
                  <div className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</div>
                </div>
                <div className={`text-sm font-semibold px-2 py-1 rounded-full transition-all duration-300 ${
                  entry.accepted 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-red-600 bg-red-100'
                }`}>
                  {entry.accepted ? '✅ Accepted' : '❌ Rejected'}
                </div>
              </div>

              {entry.parsedCommand && (
                <div className="mt-2 text-xs text-gray-700 p-2 bg-gray-50 rounded">
                  <span className="font-medium">Result:</span> {entry.parsedCommand.type} 
                  {entry.parsedCommand.color && <span className="text-blue-600"> ({entry.parsedCommand.color})</span>}
                </div>
              )}

              {entry.errors && entry.errors.length > 0 && (
                <div className="mt-2 text-xs text-red-600 p-2 bg-red-50 rounded border border-red-200">
                  <span className="font-medium">Error:</span> {entry.errors.join('; ')}
                </div>
              )}

              {entry.suggestions && entry.suggestions.length > 0 && (
                <div className="mt-2 text-xs text-blue-600 p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="font-medium">Suggestions:</span> {entry.suggestions.join(' • ')}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CommandHistory;
