import React, { useState, useEffect } from 'react';
import CanvasArea from '../components/CanvasArea.jsx';
import CommandInput from '../components/CommandInput.jsx';
import { createFSM } from '../fsm/fsmEngine.js';

const Game = ({ currentLevel = 1, onLevelComplete, onScoreUpdate }) => {
  // Game state
  const [fsm, setFsm] = useState(() => createFSM(currentLevel));
  const [drawCommands, setDrawCommands] = useState([]);
  const [feedback, setFeedback] = useState({
    type: 'info', // 'success', 'error', 'warning', 'info'
    message: 'Welcome! Try drawing a shape using voice or text commands.',
    suggestions: []
  });
  const [score, setScore] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [gameStats, setGameStats] = useState({
    totalCommands: 0,
    successfulCommands: 0,
    shapesDrawn: 0
  });

  // Speech recognition setup
  const [recognition, setRecognition] = useState(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleCommandSubmit(transcript);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setFeedback({
          type: 'error',
          message: 'Speech recognition failed. Please try again or use text input.',
          suggestions: []
        });
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  // Update FSM when level changes
  useEffect(() => {
    setFsm(createFSM(currentLevel));
    setFeedback({
      type: 'info',
      message: `Level ${currentLevel} started! Try drawing shapes with commands.`,
      suggestions: []
    });
  }, [currentLevel]);

  // Handle command submission
  const handleCommandSubmit = (commandText) => {
    const result = fsm.processCommand(commandText);
    
    // Update game stats
    setGameStats(prev => ({
      ...prev,
      totalCommands: prev.totalCommands + 1,
      successfulCommands: result.isValid ? prev.successfulCommands + 1 : prev.successfulCommands
    }));

    if (result.isValid && result.canDraw) {
      // Success - add drawing command
      setDrawCommands(prev => [...prev, result.parsedCommand]);
      setScore(prev => prev + 10);
      setGameStats(prev => ({
        ...prev,
        shapesDrawn: prev.shapesDrawn + 1
      }));
      
      setFeedback({
        type: 'success',
        message: `Great! Drew a ${result.parsedCommand.color !== '#333333' ? result.parsedCommand.color : ''} ${result.parsedCommand.size !== 'medium' ? result.parsedCommand.size : ''} ${result.parsedCommand.type}`.replace(/\s+/g, ' '),
        suggestions: ['Try drawing another shape!', 'Use different colors or sizes']
      });

      // Notify parent about score update
      if (onScoreUpdate) {
        onScoreUpdate(score + 10);
      }
      
    } else {
      // Error - show feedback
      setFeedback({
        type: 'error',
        message: result.errors[0] || 'Invalid command',
        suggestions: result.suggestions.length > 0 ? result.suggestions : [
          'Try: "draw a red circle"',
          'Try: "make a blue square"',
          'Try: "create a green triangle"'
        ]
      });
    }
  };

  // Handle voice input
  const handleStartListening = () => {
    if (recognition) {
      setIsListening(true);
      recognition.start();
      setFeedback({
        type: 'info',
        message: 'Listening... Speak your command now!',
        suggestions: []
      });
    } else {
      setFeedback({
        type: 'warning',
        message: 'Speech recognition not supported in this browser. Please use text input.',
        suggestions: []
      });
    }
  };

  const handleStopListening = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
  };

  // Handle shape drawn (callback from canvas)
  const handleShapeDrawn = (shape) => {
    console.log('Shape drawn:', shape);
  };

  // Clear canvas
  const handleClearCanvas = () => {
    setDrawCommands([]);
    setFeedback({
      type: 'info',
      message: 'Canvas cleared! Start drawing new shapes.',
      suggestions: []
    });
  };

  // Get feedback color class
  const getFeedbackColorClass = () => {
    switch (feedback.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  // Get feedback icon
  const getFeedbackIcon = () => {
    switch (feedback.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="game-container min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Grammar Drawing Game</h1>
              <p className="text-gray-600">Level {currentLevel} - Learn English through drawing!</p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">Score: {score}</div>
              <div className="text-sm text-gray-500">
                Success Rate: {gameStats.totalCommands > 0 ? Math.round((gameStats.successfulCommands / gameStats.totalCommands) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column - Canvas */}
        <div className="space-y-4">
          <CanvasArea 
            drawCommands={drawCommands}
            onShapeDrawn={handleShapeDrawn}
            canvasWidth={600}
            canvasHeight={400}
          />
          
          {/* Game Stats */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-3">Game Statistics</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{gameStats.shapesDrawn}</div>
                <div className="text-sm text-gray-600">Shapes Drawn</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{gameStats.successfulCommands}</div>
                <div className="text-sm text-gray-600">Successful Commands</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{gameStats.totalCommands}</div>
                <div className="text-sm text-gray-600">Total Attempts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Input and Feedback */}
        <div className="space-y-4">
          
          {/* Command Input */}
          <CommandInput 
            onCommandSubmit={handleCommandSubmit}
            isListening={isListening}
            onStartListening={handleStartListening}
            onStopListening={handleStopListening}
            placeholder={`Level ${currentLevel}: Type your drawing command...`}
          />
          
          {/* Feedback Box */}
          <div className={`feedback-box rounded-lg border-2 p-4 ${getFeedbackColorClass()}`}>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{getFeedbackIcon()}</span>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Feedback</h3>
                <p className="mb-3">{feedback.message}</p>
                
                {feedback.suggestions.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Suggestions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {feedback.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Level Info */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-3">Level {currentLevel} Guide</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Available Commands:</span> draw, make, create
              </div>
              <div>
                <span className="font-medium">Colors:</span> red, blue, green, yellow, orange, purple
              </div>
              <div>
                <span className="font-medium">Shapes:</span> circle, square, triangle, rectangle
              </div>
              {currentLevel >= 3 && (
                <div>
                  <span className="font-medium">Objects:</span> house, tree, star
                </div>
              )}
              {currentLevel >= 3 && (
                <div>
                  <span className="font-medium">Sizes:</span> small, big, large
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handleClearCanvas}
                className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Clear Canvas
              </button>
              <button
                onClick={() => {
                  setScore(prev => prev + 5);
                  setFeedback({
                    type: 'success',
                    message: 'Bonus points added!',
                    suggestions: ['Keep drawing to earn more points!']
                  });
                }}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Hint (+5 points)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;