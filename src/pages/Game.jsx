import React, { useState, useEffect } from 'react';
import CanvasArea from '../components/CanvasArea.jsx';
import CommandInput from '../components/CommandInput.jsx';
import LevelTracker from '../components/LevelTracker.jsx';
// Backend integration: use Python FastAPI instead of local JS FSM/rule engine
import { parseCommand, analyzeCommandAPI, getVocab } from '../services/backendApi.js';
import FeedbackBox from '../components/FeedbackBox.jsx';
import LevelUpCelebration from '../components/LevelUpCelebration.jsx';

import db from '../firebase.js';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import ScoreBoard from '../components/ScoreBoard.jsx';
import CommandHistory from '../components/CommandHistory.jsx';


const Game = ({ onLevelComplete, onScoreUpdate }) => {
  // Game state
  const [currentLevel, setCurrentLevel] = useState(1);
  // Deprecated local FSM kept for fallback only
  const [fsm, setFsm] = useState(null);
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
  const [userId, setUserId] = useState(`user_${Date.now()}`); // Simple user ID for demo purposes
  const [maxLevel, setMaxLevel] = useState(5);
  const [requiredCommandsToLevelUp, setRequiredCommandsToLevelUp] = useState(5);
  // Scoreboard & badges
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState([]);
  const [shapesTried, setShapesTried] = useState([]); // list of unique shape names tried
  const [commandHistory, setCommandHistory] = useState([]); // latest first
  const [levelVocab, setLevelVocab] = useState({});
  const [backendOnline, setBackendOnline] = useState(true);
  
  // Celebration state
  const [showLevelUpCelebration, setShowLevelUpCelebration] = useState(false);
  const [celebrationLevel, setCelebrationLevel] = useState(1);
  
  // Command feedback animations
  const [commandFeedbackAnimation, setCommandFeedbackAnimation] = useState('');
  const [canvasGlowEffect, setCanvasGlowEffect] = useState('');

  // Function to initialize or update user data in Firestore
  const initializeOrUpdateUser = async (userIdToInitialize) => {
    try {
      // Check if user document exists
      const userRef = doc(db, "users", userIdToInitialize);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create the user document if it doesn't exist
        await setDoc(userRef, {
          level: 1,
          maxLevel: 1,
          score: 0,
          totalCommands: 0,
          successfulCommands: 0,
          shapesDrawn: 0,
          createdAt: new Date()
        });
        console.log("User document created successfully");
      }
    } catch (error) {
      console.error("Error initializing user:", error);
    }
  };

  // Update the updateUserLevel function to use set with merge option
  const updateUserLevel = async (newLevel, newScore, newSuccessfulCommands) => {
    try {
      // Make sure user exists first
      await initializeOrUpdateUser(userId);
      
      // Update the user document with merge option
      await setDoc(doc(db, "users", userId), {
        level: newLevel,
        maxLevel: Math.max(newLevel, maxLevel),
        score: newScore,
        successfulCommands: newSuccessfulCommands,
        updatedAt: new Date()
      }, { merge: true });
      
      console.log("User level updated successfully");
    } catch (error) {
      console.error("Error updating user level:", error);
    }
  };

  // Speech recognition setup
  const [recognition, setRecognition] = useState(null);
  const [speechText, setSpeechText] = useState('');

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };
      
      recognitionInstance.onresult = (event) => {
        let transcript = event.results[0][0].transcript || '';
        // Remove trailing sentence punctuation (., ?, !)
        transcript = transcript.trim().replace(/[.?!]+$/,'');
        // populate the input; user will manually press Submit
        setSpeechText(transcript);
        console.log('Speech recognition result:', transcript);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        let errorMessage = 'Speech recognition failed. Please try again or use text input.';
        if (event.error === 'not-allowed') {
          errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
        } else if (event.error === 'no-speech') {
          errorMessage = 'No speech detected. Please try speaking again.';
        } else if (event.error === 'aborted') {
          errorMessage = 'Speech recognition was cancelled.';
        }
        
        setFeedback({
          type: 'error',
          message: errorMessage,
          suggestions: []
        });
      };
      
      recognitionInstance.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
      
      // Cleanup function
      return () => {
        if (recognitionInstance) {
          try {
            recognitionInstance.stop();
            recognitionInstance.abort();
          } catch (error) {
            console.log('Error during speech recognition cleanup:', error);
          }
        }
      };
    }
  }, []);

  // Load user data from Firebase
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Initialize user if they don't exist
        await initializeOrUpdateUser(userId);
        
        // Get user data
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          // User exists, load their data
          const userData = userSnap.data();
          setCurrentLevel(userData.level || 1);
          setMaxLevel(userData.maxLevel || 4);
          setScore(userData.score || 0);
          setGameStats({
            totalCommands: userData.totalCommands || 0,
            successfulCommands: userData.successfulCommands || 0,
            shapesDrawn: userData.shapesDrawn || 0
          });
          setStreak(userData.streak || 0);
          setBadges(userData.badges || []);
          setShapesTried(userData.shapesTried || []);
          setFeedback({
            type: 'info',
            message: `Welcome back! You are on level ${userData.level || 1}.`,
            suggestions: ['Try drawing some shapes to continue!']
          });
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        setFeedback({
          type: 'warning',
          message: 'Could not load your progress. Starting from level 1.',
          suggestions: []
        });
      }
    };
    
    loadUserData();
  }, [userId]);

  // Update FSM when level changes
  useEffect(() => {
    // No-op for Python backend; left for potential fallback
    setFsm(null);
    setFeedback({
      type: 'info',
      message: `Level ${currentLevel} started! Try drawing shapes with commands.`,
      suggestions: []
    });

    // Use the correct updateUserLevel function (setDoc with merge)
    updateUserLevel(currentLevel, score, gameStats.successfulCommands);
    // Remove the inner updateUserLevel function that used updateDoc!
  }, [currentLevel, userId, score, gameStats.successfulCommands]);

  // Fetch level vocabulary from Python backend when level changes
  useEffect(() => {
    let cancelled = false;
    const loadVocab = async () => {
      try {
        const v = await getVocab(currentLevel);
        if (!cancelled) {
          setLevelVocab(v || {});
          setBackendOnline(true);
        }
      } catch (e) {
        console.warn('Failed to load vocab from backend, using empty vocab:', e);
        if (!cancelled) {
          setLevelVocab({});
          setBackendOnline(false);
        }
      }
    };
    loadVocab();
    return () => { cancelled = true; };
  }, [currentLevel]);

  // Handle command submission
  const handleCommandSubmit = async (commandText) => {
    console.log('[Game] submitted command:', commandText);
  const text = (commandText || '').toString().trim().replace(/[.?!]+$/,'');
    const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
    console.log('[Game] tokens:', tokens);

  // Token category/validation is now handled by the Python backend

    // Call Python backend for parse + analyze
    let result = null;
    let analysis = null;
    try {
      result = await parseCommand(commandText, currentLevel);
  setBackendOnline(true);
    } catch (e) {
      console.error('Backend parse error, falling back to client:', e);
      // Fallback: minimal invalid result
      result = { isValid: false, canDraw: false, errors: ['Backend unavailable'], suggestions: [], parsedCommand: {} };
  setBackendOnline(false);
    }
    try {
      analysis = await analyzeCommandAPI(commandText, currentLevel);
  setBackendOnline(true);
    } catch (e) {
      console.error('Backend analyze error:', e);
      analysis = null;
  setBackendOnline(false);
    }
    
    // Update game stats
    const newStats = {
      ...gameStats,
      totalCommands: gameStats.totalCommands + 1,
      successfulCommands: result.isValid ? gameStats.successfulCommands + 1 : gameStats.successfulCommands
    };
    
    setGameStats(newStats);

    if (result.isValid && result.canDraw) {
      // Update streak
      const newStreak = streak + 1;
      setStreak(newStreak);

      // Award streak badges at milestones
      const streakMilestones = [5, 10, 20];
      if (streakMilestones.includes(newStreak)) {
        const badge = {
          id: `streak_${newStreak}`,
          title: `Streak ${newStreak}`,
          description: `Achieved a streak of ${newStreak} successful commands!`,
          awardedAt: new Date().toISOString()
        };
        awardBadge(badge);
      }

      // Track shapes tried
      const shapeName = result.parsedCommand && result.parsedCommand.type ? result.parsedCommand.type : null;
      if (shapeName && !shapesTried.includes(shapeName)) {
        const newShapes = [...shapesTried, shapeName];
        setShapesTried(newShapes);

        // Check if all shapes for this level are tried
  const availableShapes = (levelVocab?.SHAPES || levelVocab?.SHAPE || []);
        // normalize availableShapes to array of strings
        const avail = Array.isArray(availableShapes) ? availableShapes : [];
        const allTried = avail.length > 0 && avail.every(s => newShapes.includes(s));
        if (allTried) {
          const badge = {
            id: `all_shapes_level_${currentLevel}`,
            title: `All Shapes Tried (L${currentLevel})`,
            description: `Tried all shapes available in level ${currentLevel}.`,
            awardedAt: new Date().toISOString()
          };
          awardBadge(badge);
        }
      }
      // Success - add drawing command
      setDrawCommands(prev => [...prev, result.parsedCommand]);
      const newScore = score + 10;
      setScore(newScore);
      
      // Success visual effects
      setCommandFeedbackAnimation('success-glow');
      setCanvasGlowEffect('success-glow');
      
      // Clear success effects after animation
      setTimeout(() => {
        setCommandFeedbackAnimation('');
        setCanvasGlowEffect('');
      }, 1000);
      
      const updatedStats = {
        ...newStats,
        shapesDrawn: newStats.shapesDrawn + 1
      };
      
      setGameStats(updatedStats);
      
      // Prefer rule engine feedback if it produced a message; otherwise set simple success
      if (analysis && analysis.message) {
        setFeedback(analysis);
      } else {
        setFeedback({
          type: 'success',
          message: `Great! Drew a ${result.parsedCommand.color !== '#333333' ? result.parsedCommand.color : ''} ${result.parsedCommand.size !== 'medium' ? result.parsedCommand.size : ''} ${result.parsedCommand.type}`.replace(/\s+/g, ' '),
          suggestions: ['Try drawing another shape!', 'Use different colors or sizes']
        });
      }

      // Save updated stats to Firebase
      const updateUserStats = async () => {
        try {
          await updateDoc(doc(db, "users", userId), {
            score: newScore,
            totalCommands: updatedStats.totalCommands,
            successfulCommands: updatedStats.successfulCommands,
            shapesDrawn: updatedStats.shapesDrawn,
            streak: newStreak,
            shapesTried: shapesTried,
            // update history
            commandHistory: commandHistory,
            updatedAt: new Date()
          });
          console.log("User stats updated in Firebase");
        } catch (err) {
          console.error("Error updating user stats:", err);
        }
      };
      
      updateUserStats();

      // push to history
      pushHistory({
        command: commandText,
        accepted: true,
        parsedCommand: result.parsedCommand,
        errors: result.errors,
        suggestions: result.suggestions,
        timestamp: new Date().toISOString()
      });

      // Notify parent about score update
      if (onScoreUpdate) {
        onScoreUpdate(newScore);
      }
      
    } else {
      // Error - show feedback
      // reset streak on failure
      setStreak(0);
      
      // Failure visual effects
      setCommandFeedbackAnimation('shake error-pulse');
      
      // Clear failure effects after animation
      setTimeout(() => {
        setCommandFeedbackAnimation('');
      }, 800);

      // Prefer analyzer feedback if it exists
      if (analysis && analysis.message) {
        setFeedback(analysis);
      } else {
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
      
      // Save updated stats to Firebase (even on error)
      const updateUserStats = async () => {
        try {
          await updateDoc(doc(db, "users", userId), {
            totalCommands: newStats.totalCommands,
            streak: 0,
            commandHistory: commandHistory,
            updatedAt: new Date()
          });
        } catch (err) {
          console.error("Error updating user stats:", err);
        }
      };
      
      updateUserStats();

      // push to history (rejected)
      pushHistory({
        command: commandText,
        accepted: false,
        parsedCommand: result.parsedCommand || null,
        errors: result.errors,
        suggestions: result.suggestions,
        timestamp: new Date().toISOString()
      });
    }
  };

  // add entry to history (keeps last 10)
  const pushHistory = async (entry) => {
    try {
      const newHist = [entry, ...commandHistory].slice(0, 10);
      setCommandHistory(newHist);
      // persist
      await setDoc(doc(db, "users", userId), { commandHistory: newHist }, { merge: true });
    } catch (err) {
      console.error('Error saving history:', err);
    }
  };

  // Award badge helper (avoids duplicates and persists)
  const awardBadge = async (badge) => {
    if (!badge || !badge.id) return;
    const exists = badges.find(b => b.id === badge.id);
    if (exists) return;
    const newBadges = [...badges, badge];
    setBadges(newBadges);

    // persist badges to Firestore (merge)
    try {
      await setDoc(doc(db, "users", userId), {
        badges: newBadges
      }, { merge: true });
      console.log('Badge awarded and saved:', badge.id);
    } catch (err) {
      console.error('Error saving badge:', err);
    }
  };

  // Handle level up
  const handleLevelUp = async () => {
    if (currentLevel < maxLevel && gameStats.successfulCommands >= requiredCommandsToLevelUp) {
      const newLevel = currentLevel + 1;
      
      // Bonus points for leveling up
      const levelUpBonus = 50;
      const newScore = score + levelUpBonus;
      
      // Reset successful commands count for the new level
      const resetStats = {
        ...gameStats,
        successfulCommands: 0 // Reset to 0 for the new level
      };
      
      // Update state
      setCurrentLevel(newLevel);
      setScore(newScore);
      setGameStats(resetStats);
      
      // Trigger level-up celebration
      setCelebrationLevel(newLevel);
      setShowLevelUpCelebration(true);
      
      setFeedback({
        type: 'success',
        message: `Congratulations! You've advanced to Level ${newLevel}! (+${levelUpBonus} bonus points)`,
        suggestions: [
          'Try the new vocabulary!', 
          'New shapes and colors are available!'
        ]
      });
      
      // Update in Firebase using our new function
      await updateUserLevel(newLevel, newScore, 0); // Pass 0 for reset successful commands
      
      // Also update the game stats in Firebase with reset count
      try {
        await updateDoc(doc(db, "users", userId), {
          totalCommands: resetStats.totalCommands,
          successfulCommands: 0, // Reset to 0
          shapesDrawn: resetStats.shapesDrawn,
          updatedAt: new Date()
        });
      } catch (err) {
        console.error("Error updating reset stats:", err);
      }
      
      // Notify parent about level completion if provided
      if (onLevelComplete) {
        onLevelComplete(newLevel);
      }
    }
  };

  // Handle voice input
  const handleStartListening = () => {
    if (!recognition) {
      setFeedback({
        type: 'warning',
        message: 'Speech recognition not supported in this browser. Please use text input.',
        suggestions: []
      });
      return;
    }

    // Check if already listening to prevent double start
    if (isListening) {
      console.log('Speech recognition already running');
      return;
    }

    try {
      setIsListening(true);
      recognition.start();
      setFeedback({
        type: 'info',
        message: 'Listening... Speak your command now!',
        suggestions: []
      });
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsListening(false);
      setFeedback({
        type: 'error',
        message: 'Failed to start speech recognition. Please try again.',
        suggestions: []
      });
    }
  };

  const handleStopListening = () => {
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
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
        <div className="bg-white rounded-lg shadow-md p-4 card-hover">
          {!backendOnline && (
            <div className="mb-3 p-2 rounded bg-red-50 border border-red-200 text-red-800 text-sm slide-in-bottom">
              Backend offline — parsing disabled. Start the FastAPI server (see backend/README.md).
            </div>
          )}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 fade-in-scale">Grammar Drawing Game</h1>
              <p className="text-gray-600 fade-in-scale stagger-1">Level {currentLevel} - Learn English through drawing!</p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 transition-all duration-300 hover:scale-110 count-up">
                Score: {score}
              </div>
              <div className="text-sm text-gray-500 fade-in-scale stagger-2">
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
            glowEffect={canvasGlowEffect}
          />
          
          {/* Game Stats */}
          <div className="bg-white rounded-lg shadow-md p-4 card-hover">
            <h3 className="text-lg font-semibold mb-3">Game Statistics</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 transition-all duration-300">{gameStats.shapesDrawn}</div>
                <div className="text-sm text-gray-600">Shapes Drawn</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 transition-all duration-300">{gameStats.successfulCommands}</div>
                <div className="text-sm text-gray-600">Successful Commands</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600 transition-all duration-300">{gameStats.totalCommands}</div>
                <div className="text-sm text-gray-600">Total Attempts</div>
              </div>
            </div>
          </div>

          {/* Level Guide */}
          <div className="bg-white rounded-lg shadow-md p-4 card-hover">
            <h3 className="text-lg font-semibold mb-3">Level {currentLevel} Guide</h3>
            <div className="space-y-2 text-sm">
              <div className="fade-in-scale stagger-1">
                <span className="font-medium">Available Commands:</span> draw, make, create
                {currentLevel >= 3 && ', paint'}
                {currentLevel >= 4 && ', sketch, add'}
              </div>
              <div className="fade-in-scale stagger-2">
                <span className="font-medium">Colors:</span> red, blue, green, yellow
                {currentLevel >= 2 && ', orange, purple'}
                {currentLevel >= 3 && ', pink, black, white'}
                {currentLevel >= 4 && ', gray, brown, cyan, magenta'}
                {currentLevel >= 5 && ', lime, navy, maroon, olive'}
              </div>
              <div className="fade-in-scale stagger-3">
                <span className="font-medium">Shapes:</span> circle, square
                {currentLevel >= 2 && ', triangle, rectangle'}
                {currentLevel >= 3 && ', line'}
                {currentLevel >= 4 && ', oval, diamond'}
              </div>
              {currentLevel >= 3 && (
                <div className="fade-in-scale stagger-4">
                  <span className="font-medium">Objects:</span> house, tree, star
                  {currentLevel >= 4 && ', car, heart, flower, sun, moon'}
                  {currentLevel >= 5 && ', cloud, mountain, boat, fish, bird'}
                </div>
              )}
              {currentLevel >= 3 && (
                <div className="fade-in-scale stagger-5">
                  <span className="font-medium">Sizes:</span> small, big, large
                  {currentLevel >= 4 && ', tiny, medium, huge'}
                  {currentLevel >= 5 && ', giant'}
                </div>
              )}
            </div>
          </div>

          {/* Level Tracker */}
          <LevelTracker 
            currentLevel={currentLevel}
            maxLevel={maxLevel}
            successfulCommands={gameStats.successfulCommands}
            requiredCommandsToLevelUp={requiredCommandsToLevelUp}
            onLevelUp={handleLevelUp}
          />
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
            speechText={speechText}
            feedbackAnimation={commandFeedbackAnimation}
          />
          
          {/* Feedback Box (powered by ruleEngine) */}
          <FeedbackBox feedback={feedback} animationTrigger={commandFeedbackAnimation} />

          {/* Scoreboard */}
          <ScoreBoard score={score} streak={streak} badges={badges} />

          {/* Command History */}
          <CommandHistory history={commandHistory} />
        </div>
      </div>
      
      {/* Level Up Celebration */}
      {showLevelUpCelebration && (
        <LevelUpCelebration 
          level={celebrationLevel}
          onComplete={() => setShowLevelUpCelebration(false)}
        />
      )}
    </div>
  );
};

export default Game;