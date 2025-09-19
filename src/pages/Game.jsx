import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CanvasArea from '../components/CanvasArea.jsx';
import CommandInput from '../components/CommandInput.jsx';
import LevelTracker from '../components/LevelTracker.jsx';
// Backend integration: use Python FastAPI instead of local JS FSM/rule engine
import { parseCommand, analyzeCommandAPI, getVocab } from '../services/backendApi.js';
import { translateToEnglish } from '../services/translationService.js';
import { normalizeEnglishForGrammar } from '../services/normalizeService.js';
import FeedbackBox from '../components/FeedbackBox.jsx';
import LevelUpCelebration from '../components/LevelUpCelebration.jsx';
import TrainingCompleteModal from '../components/TrainingCompleteModal.jsx';
import ConfettiBurst from '../components/ConfettiBurst.jsx';

import db from '../firebase.js';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from "firebase/firestore";
import ScoreBoard from '../components/ScoreBoard.jsx';
import CommandHistory from '../components/CommandHistory.jsx';
import ParsedView from '../components/ParsedView.jsx';


const Game = ({ onLevelComplete, onScoreUpdate }) => {
  const { t, i18n } = useTranslation();
  // Game state
  const [currentLevel, setCurrentLevel] = useState(1);
  // Deprecated local FSM kept for fallback only
  const [fsm, setFsm] = useState(null);
  const [drawCommands, setDrawCommands] = useState([]);
  const [feedback, setFeedback] = useState({
    type: 'info', // 'success', 'error', 'warning', 'info'
    message: t('welcomeMessage'),
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

  // Parsed view state
  const [pvOriginal, setPvOriginal] = useState('');
  const [pvTranslated, setPvTranslated] = useState('');
  const [pvNormalized, setPvNormalized] = useState('');
  const [pvTokens, setPvTokens] = useState([]);
  const [pvParsed, setPvParsed] = useState(null);
  
  // Celebration state
  const [showLevelUpCelebration, setShowLevelUpCelebration] = useState(false);
  const [celebrationLevel, setCelebrationLevel] = useState(1);
  const [showTrainingComplete, setShowTrainingComplete] = useState(false);
  
  // Command feedback animations
  const [commandFeedbackAnimation, setCommandFeedbackAnimation] = useState('');
  const [canvasGlowEffect, setCanvasGlowEffect] = useState('');

  // Language state
  const [language, setLanguage] = useState(i18n.language); // 'en', 'ta', 'hi', 'ml'

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

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
            message: t('welcomeBack', { level: userData.level || 1 }),
            suggestions: [t('tryDrawingMore')]
          });
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        setFeedback({
          type: 'warning',
          message: t('loadProgressError'),
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
      message: t('levelStart', { level: currentLevel }),
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

  // Translate command if necessary
  const translatedCommand = await translateToEnglish(commandText, language);
  console.log(`[Game] Translated command: ${translatedCommand}`);

  // Normalize translated English to match parser vocabulary
  const normalizedForParser = normalizeEnglishForGrammar(translatedCommand);
  console.log(`[Game] Normalized command: ${normalizedForParser}`);

  const text = (normalizedForParser || '').toString().trim().replace(/[.?!]+$/,'');
    const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
    console.log('[Game] tokens:', tokens);

  // Update parsed view input parts early
  setPvOriginal(commandText);
  setPvTranslated(translatedCommand);
  setPvNormalized(normalizedForParser);
  setPvTokens(tokens);

    // Token category/validation is now handled by the Python backend

    // Call Python backend for parse + analyze
    let result = null;
    let analysis = null;
    try {
      result = await parseCommand(normalizedForParser, currentLevel);
      setBackendOnline(true);
    } catch (e) {
      console.error('Backend parse error, falling back to client:', e);
      // Fallback: minimal invalid result
      result = { isValid: false, canDraw: false, errors: ['Backend unavailable'], suggestions: [], parsedCommand: {} };
      setBackendOnline(false);
    }
    try {
      analysis = await analyzeCommandAPI(normalizedForParser, currentLevel);
      setBackendOnline(true);
    } catch (e) {
      console.error('Backend analyze error:', e);
      analysis = null;
      setBackendOnline(false);
    }
    
    // Update game stats (functional to avoid stale state)
    if (result.isValid) {
      setGameStats(prev => ({
        ...prev,
        totalCommands: prev.totalCommands + 1,
        successfulCommands: prev.successfulCommands + 1
      }));
    } else {
      setGameStats(prev => ({
        ...prev,
        totalCommands: prev.totalCommands + 1
      }));
    }

    if (result.isValid && result.canDraw) {
      setPvParsed(result.parsedCommand || null);
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
  // Increment score safely
  setScore(prev => prev + 10);
      
      // Success visual effects
      setCommandFeedbackAnimation('success-glow');
      setCanvasGlowEffect('success-glow');
      
      // Clear success effects after animation
      setTimeout(() => {
        setCommandFeedbackAnimation('');
        setCanvasGlowEffect('');
      }, 1000);
      
      // Increment shapesDrawn using functional update to prevent off-by-one
      setGameStats(prev => ({
        ...prev,
        shapesDrawn: prev.shapesDrawn + 1
      }));
      
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
            score: increment(10),
            totalCommands: increment(1),
            successfulCommands: increment(1),
            shapesDrawn: increment(1),
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
        onScoreUpdate(score + 10);
      }
      
    } else {
  // Error - show feedback
  setPvParsed(result.parsedCommand || null);
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
            totalCommands: increment(1),
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
    if (gameStats.successfulCommands < requiredCommandsToLevelUp) return;

    // If already at or beyond cap, show training complete once
    if (currentLevel >= maxLevel) {
      if (!showTrainingComplete) {
        setShowTrainingComplete(true);
        setFeedback({
          type: 'success',
          message: t('trainingComplete.toast'),
          suggestions: []
        });
      }
      return;
    }

    if (currentLevel < maxLevel) {
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
        message: t('levelUpCongrats', { level: newLevel, bonus: levelUpBonus }),
        suggestions: [t('tryNewVocab'), t('newShapesAvailable')]
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
      message: t('canvasCleared'),
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
              {t('banner.backendOffline')}
            </div>
          )}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 fade-in-scale">{t('game.title')}</h1>
              <p className="text-gray-600 fade-in-scale stagger-1">{t('game.subtitle', { level: currentLevel })}</p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 transition-all duration-300 hover:scale-110 count-up">
                {t('score')}: {score}
              </div>
              <div className="text-sm text-gray-500 fade-in-scale stagger-2">
                {t('stats.successRate')}: {gameStats.totalCommands > 0 ? Math.round((gameStats.successfulCommands / gameStats.totalCommands) * 100) : 0}%
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
            <h3 className="text-lg font-semibold mb-3">{t('stats.title')}</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 transition-all duration-300">{gameStats.shapesDrawn}</div>
                <div className="text-sm text-gray-600">{t('stats.shapesDrawn')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 transition-all duration-300">{gameStats.successfulCommands}</div>
                <div className="text-sm text-gray-600">{t('stats.successfulCommands')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600 transition-all duration-300">{gameStats.totalCommands}</div>
                <div className="text-sm text-gray-600">{t('stats.totalAttempts')}</div>
              </div>
            </div>
          </div>

          {/* Level Guide */}
          <div className="bg-white rounded-lg shadow-md p-4 card-hover">
            <h3 className="text-lg font-semibold mb-3">{t('guide.title', { level: currentLevel })}</h3>
            <div className="space-y-2 text-sm">
              <div className="fade-in-scale stagger-1">
                <span className="font-medium">{t('guide.availableCommands')}</span> draw, make
                {currentLevel >= 2 && ', create, paint'}
                {currentLevel >= 4 && ', sketch, add'}
              </div>
              <div className="fade-in-scale stagger-2">
                <span className="font-medium">{t('guide.colors')}</span> red, blue, green, yellow
                {currentLevel >= 2 && ', orange, purple'}
                {currentLevel >= 3 && ', pink, black, white'}
                {currentLevel >= 4 && ', gray, brown, cyan, magenta'}
                {currentLevel >= 5 && ', lime, navy, maroon, olive'}
              </div>
              <div className="fade-in-scale stagger-3">
                <span className="font-medium">{t('guide.shapes')}</span> circle, square
                {currentLevel >= 2 && ', triangle, rectangle'}
                {currentLevel >= 3 && ', line'}
                {currentLevel >= 4 && ', oval, diamond'}
              </div>
              {currentLevel >= 3 && (
                <div className="fade-in-scale stagger-4">
                  <span className="font-medium">{t('guide.objects')}</span> house, tree, star
                  {currentLevel >= 4 && ', car, heart, flower, sun, moon'}
                  {currentLevel >= 5 && ', cloud, mountain, boat, fish, bird'}
                </div>
              )}
              {currentLevel >= 3 && (
                <div className="fade-in-scale stagger-5">
                  <span className="font-medium">{t('guide.sizes')}</span> small, big, large
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
          
          {/* Language Selector */}
          <div className="language-selector-container bg-white p-3 rounded-lg shadow-md border border-gray-200">
            <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mb-2">
              {t('selectLanguage')}
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="en">English</option>
              <option value="ta">Tamil</option>
              <option value="hi">Hindi</option>
              <option value="ml">Malayalam</option>
            </select>
          </div>

          {/* Command Input */}
          <CommandInput 
            onCommandSubmit={handleCommandSubmit}
            isListening={isListening}
            onStartListening={handleStartListening}
            onStopListening={handleStopListening}
            placeholder={t('commandPlaceholder', { level: currentLevel })}
            speechText={speechText}
            feedbackAnimation={commandFeedbackAnimation}
          />
          
          {/* Feedback Box (powered by ruleEngine) */}
          <FeedbackBox feedback={feedback} animationTrigger={commandFeedbackAnimation} />

          {/* Parsed View */}
          <ParsedView 
            original={pvOriginal} 
            translated={pvTranslated} 
            normalized={pvNormalized} 
            tokens={pvTokens} 
            parsedCommand={pvParsed} 
          />

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
      {showTrainingComplete && (
        <ConfettiBurst durationMs={2800} intensity={1.0} onDone={null} />
      )}
      <TrainingCompleteModal
        open={showTrainingComplete}
        onClose={() => setShowTrainingComplete(false)}
      />
    </div>
  );
};

export default Game;