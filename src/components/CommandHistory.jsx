import React from 'react';

const CommandHistory = ({ history = [] }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">Command History</h3>
      {history.length === 0 ? (
        <div className="text-sm text-gray-400">No commands yet.</div>
      ) : (
        <ul className="space-y-3 text-sm">
          {history.map((entry, idx) => (
            <li key={entry.timestamp + '-' + idx} className="border rounded p-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{entry.command}</div>
                  <div className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</div>
                </div>
                <div className={`text-sm font-semibold ${entry.accepted ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.accepted ? 'Accepted' : 'Rejected'}
                </div>
              </div>

              {entry.parsedCommand && (
                <div className="mt-2 text-xs text-gray-700">Result: {entry.parsedCommand.type} {entry.parsedCommand.color ? `(${entry.parsedCommand.color})` : ''}</div>
              )}

              {entry.errors && entry.errors.length > 0 && (
                <div className="mt-2 text-xs text-red-600">Error: {entry.errors.join('; ')}</div>
              )}

              {entry.suggestions && entry.suggestions.length > 0 && (
                <div className="mt-2 text-xs text-blue-600">Suggestions: {entry.suggestions.join(' • ')}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CommandHistory;
