import React, { useState, useRef, useEffect } from 'react';

const CommandInput = ({ 
  onCommandSubmit, 
  isListening = false, 
  onStartListening, 
  onStopListening,
  placeholder = "Type your command (e.g., 'Draw a red circle')",
  disabled = false 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef(null);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (inputValue.trim() && onCommandSubmit) {
      onCommandSubmit(inputValue.trim());
      setInputValue(''); // Clear input after submission
    }
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  
  // Handle microphone toggle
  const handleMicToggle = () => {
    if (isListening) {
      onStopListening && onStopListening();
    } else {
      onStartListening && onStartListening();
    }
  };
  
  // Handle Enter key for quick submission
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  // Focus management
  const handleFocus = () => setIsInputFocused(true);
  const handleBlur = () => setIsInputFocused(false);
  
  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);
  
  return (
    <div className="command-input-container bg-white border-2 border-gray-300 rounded-lg shadow-lg">
      <div className="p-3 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-700">Command Input</h3>
        <p className="text-sm text-gray-500 mt-1">
          Type or speak your drawing commands
        </p>
      </div>
      
      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Section */}
          <div className="relative">
            <div className={`flex items-center border-2 rounded-lg transition-colors ${
              isInputFocused 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
                className="flex-1 p-3 bg-transparent outline-none text-gray-700 placeholder-gray-400 disabled:cursor-not-allowed"
              />
              
              {/* Microphone Button */}
              <button
                type="button"
                onClick={handleMicToggle}
                disabled={disabled}
                className={`p-3 m-1 rounded-lg transition-all duration-200 disabled:cursor-not-allowed ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse hover:bg-red-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:bg-gray-100'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a2 2 0 114 0v4a2 2 0 11-4 0V7z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Voice status indicator */}
            {isListening && (
              <div className="absolute -bottom-6 left-0 flex items-center space-x-1 text-red-500 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Listening...</span>
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-between items-center pt-2">
            <div className="text-sm text-gray-500">
              Press Enter or click Submit
            </div>
            
            <button
              type="submit"
              disabled={disabled || !inputValue.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Submit
            </button>
          </div>
        </form>
        
        {/* Quick Command Examples */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Example commands:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Draw a red circle",
              "Make a blue square", 
              "Create a green triangle",
              "Draw a big yellow house"
            ].map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setInputValue(example)}
                disabled={disabled}
                className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandInput;