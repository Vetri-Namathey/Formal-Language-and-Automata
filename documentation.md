# Formal Language Drawing Assistant (FLDA)

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Features](#features)
4. [Technical Implementation](#technical-implementation)
5. [Multilingual Support](#multilingual-support)
6. [Test Cases](#test-cases)
7. [Future Enhancements](#future-enhancements)

## Project Overview

### Purpose
The Formal Language Drawing Assistant (FLDA) is an innovative educational tool designed to bridge the gap between natural language processing and computer graphics. It allows users to draw shapes and create simple diagrams using natural language commands in multiple languages (English, Tamil, Hindi, and Malayalam).

### Core Concept
The system interprets natural language commands through a formal grammar-based approach, translating them into drawing operations. This creates an intuitive interface for users to create visual content through spoken or written commands.

## System Architecture

### Frontend (React.js)
- **Component Structure**
  - Game.jsx: Main game logic and speech recognition
  - CanvasArea.jsx: Drawing canvas implementation
  - CommandInput.jsx: Text and voice input handling
  - LevelTracker.jsx: Progress tracking
  - ScoreBoard.jsx: Score display and management
  - FeedbackBox.jsx: User feedback system

### Backend (FastAPI)
- Command parsing and validation
- Grammar rule processing
- Drawing instruction generation

### Integration Services
1. **Speech Recognition**
   - Web Speech API integration
   - Multi-language support
   - Real-time voice input processing

2. **Translation Service**
   - Groq API integration for accurate translations
   - Support for multiple Indian languages

3. **Firebase Integration**
   - User progress tracking
   - Score persistence
   - Authentication system

## Features

### 1. Multilingual Command Processing
- Support for English, Tamil, Hindi, and Malayalam
- Real-time speech recognition
- Automatic language detection
- Seamless language switching

### 2. Drawing Capabilities
- Basic shapes (circle, square, rectangle, triangle)
- Color support
- Size specifications
- Position control
- Multiple shape combinations

### 3. Learning System
- Progressive difficulty levels
- Instant feedback
- Score tracking
- Achievement system
- Performance analytics

### 4. User Interface
- Intuitive command input
- Visual feedback
- Real-time drawing updates
- Error handling with suggestions
- Progress visualization

## Technical Implementation

### Speech Recognition System
```javascript
// Language mapping for different locales
const langMap = {
  'en': 'en-US',
  'ta': 'ta-IN',
  'hi': 'hi-IN',
  'ml': 'ml-IN'
};

// Speech recognition initialization
useEffect(() => {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = langMap[language] || 'en-US';
    // ... event handlers
  }
}, []);
```

### Translation Pipeline
1. Voice/Text Input → Native Language Text
2. Translation to English using Groq API
3. Grammar Processing
4. Drawing Command Generation
5. Canvas Execution

### Grammar Rules (Sample)
```python
grammar_rules = {
  'COMMAND': ['DRAW_ACTION SHAPE COLOR_SPEC SIZE_SPEC POSITION'],
  'DRAW_ACTION': ['draw', 'create', 'make'],
  'SHAPE': ['circle', 'square', 'rectangle', 'triangle'],
  'COLOR_SPEC': ['in COLOR', 'COLOR colored'],
  'COLOR': ['red', 'blue', 'green', 'yellow'],
  'SIZE_SPEC': ['small', 'medium', 'large'],
  'POSITION': ['at COORDINATE', 'in the CENTER']
}
```

## Multilingual Support

### Implemented Languages
1. **English (en-US)**
   - Primary development language
   - Complete grammar support
   - Native speech recognition

2. **Tamil (ta-IN)**
   - Full translation support
   - Native speech recognition
   - Culturally adapted commands

3. **Hindi (hi-IN)**
   - Complete integration
   - Native speech recognition
   - Regional command variations

4. **Malayalam (ml-IN)**
   - Full language support
   - Native speech recognition
   - Local linguistic adaptations

### Translation Process
1. Native language input capture
2. Groq API translation
3. Grammar normalization
4. Command parsing
5. Execution

## Test Cases

### 1. Basic Shape Drawing
```plaintext
Test Case ID: TC001
Command: "Draw a red circle"
Expected: Creates a red circle in default size at center
Status: ✓ Passed
```

### 2. Multilingual Commands
```plaintext
Test Case ID: TC002
Command: "சிவப்பு வட்டம் வரை" (Tamil)
Expected: Creates a red circle
Status: ✓ Passed

Test Case ID: TC003
Command: "लाल वृत्त बनाएं" (Hindi)
Expected: Creates a red circle
Status: ✓ Passed
```

### 3. Complex Commands
```plaintext
Test Case ID: TC004
Command: "Draw a large blue square above a small red circle"
Expected: Creates two shapes in specified relation
Status: ✓ Passed
```

### 4. Error Handling
```plaintext
Test Case ID: TC005
Command: "Create a purple hexagon"
Expected: Error message for unsupported shape/color
Status: ✓ Passed
```

### 5. Language Switching
```plaintext
Test Case ID: TC006
Action: Switch language while in drawing mode
Expected: Maintains state, updates UI, recognizes new language
Status: ✓ Passed
```

## Future Enhancements

### Planned Features
1. **Advanced Shape Support**
   - Polygons with arbitrary sides
   - Curved shapes
   - 3D primitives

2. **Enhanced Language Processing**
   - Natural language understanding
   - Context-aware commands
   - Compound instructions

3. **Educational Features**
   - Interactive tutorials
   - Challenge modes
   - Collaborative drawing

4. **Technical Improvements**
   - Offline support
   - Performance optimization
   - Mobile responsiveness

### Research Areas
1. **Natural Language Processing**
   - Enhanced grammar understanding
   - Context awareness
   - Ambiguity resolution

2. **Machine Learning Integration**
   - Command prediction
   - User behavior analysis
   - Personalized suggestions

3. **Accessibility**
   - Screen reader support
   - Alternative input methods
   - Universal design principles

## Conclusion
The Formal Language Drawing Assistant represents a significant step forward in natural language interfaces for drawing applications. Through its multilingual support and intuitive command processing, it demonstrates the potential for language-based interactions in educational software. The project successfully combines formal language theory with practical application, creating an engaging platform for learning and creativity.