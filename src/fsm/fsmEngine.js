// Finite State Machine Engine for Grammar Validation

import { 
  GRAMMAR_PATTERNS, 
  categorizeWord, 
  getLevelVocabulary,
  isWordValidForLevel,
  getCorrectArticle,
  COMMON_MISTAKES 
} from './grammar.js';

// FSM States
export const FSM_STATES = {
  START: 'START',
  COMMAND: 'COMMAND',
  ARTICLE: 'ARTICLE',
  SIZE: 'SIZE',
  COLOR: 'COLOR',
  SHAPE: 'SHAPE',
  OBJECT: 'OBJECT',
  END: 'END',
  ERROR: 'ERROR'
};

// State transitions map
const STATE_TRANSITIONS = {
  [FSM_STATES.START]: {
    COMMAND: FSM_STATES.COMMAND
  },
  [FSM_STATES.COMMAND]: {
    ARTICLE: FSM_STATES.ARTICLE,
    SIZE: FSM_STATES.SIZE,
    COLOR: FSM_STATES.COLOR,
    SHAPE: FSM_STATES.SHAPE,
    OBJECT: FSM_STATES.OBJECT
  },
  [FSM_STATES.ARTICLE]: {
    SIZE: FSM_STATES.SIZE,
    COLOR: FSM_STATES.COLOR,
    SHAPE: FSM_STATES.SHAPE,
    OBJECT: FSM_STATES.OBJECT
  },
  [FSM_STATES.SIZE]: {
    COLOR: FSM_STATES.COLOR,
    SHAPE: FSM_STATES.SHAPE,
    OBJECT: FSM_STATES.OBJECT
  },
  [FSM_STATES.COLOR]: {
    SIZE: FSM_STATES.SIZE,
    SHAPE: FSM_STATES.SHAPE,
    OBJECT: FSM_STATES.OBJECT
  },
  [FSM_STATES.SHAPE]: {
    END: FSM_STATES.END
  },
  [FSM_STATES.OBJECT]: {
    END: FSM_STATES.END
  }
};

// FSM Engine Class
export class FSMEngine {
  constructor(level = 1) {
    this.level = level;
    this.reset();
  }

  // Reset FSM to initial state
  reset() {
    this.currentState = FSM_STATES.START;
    this.processedTokens = [];
    this.errors = [];
    this.suggestions = [];
    this.parsedCommand = {};
  }

  // Set current level
  setLevel(level) {
    this.level = level;
  }

  // Process a single token
  processToken(token) {
    const word = token.toLowerCase().trim();
    const category = categorizeWord(word);
    
    // Check if word is valid for current level
    if (!isWordValidForLevel(word, this.level) && category !== 'UNKNOWN') {
      this.addError(`"${word}" is not available in level ${this.level}`);
      return false;
    }

    // Check if transition is valid
    const validTransitions = STATE_TRANSITIONS[this.currentState] || {};
    
    if (!validTransitions[category]) {
      this.handleInvalidTransition(word, category);
      return false;
    }

    // Valid transition - update state
    this.currentState = validTransitions[category];
    this.processedTokens.push({ word, category });
    
    // Store parsed information
    this.updateParsedCommand(word, category);
    
    return true;
  }

  // Process complete command
  processCommand(commandString) {
    this.reset();
    
    // Clean and tokenize input
    const tokens = this.tokenizeCommand(commandString);
    
    if (tokens.length === 0) {
      this.addError('Please enter a command');
      return this.getResult();
    }

    // Check for common mistakes first
    const correctedCommand = this.checkCommonMistakes(commandString);
    if (correctedCommand !== commandString) {
      this.addSuggestion(`Did you mean: "${correctedCommand}"?`);
    }

    // Process each token
    let success = true;
    for (const token of tokens) {
      if (!this.processToken(token)) {
        success = false;
        break;
      }
    }

    // Check if we reached a valid end state
    if (success && !this.isValidEndState()) {
      this.addError('Incomplete command. Please specify what to draw.');
      success = false;
    }

    // If successful, finalize the parsed command
    if (success) {
      this.currentState = FSM_STATES.END;
      this.finalizeParsedCommand();
    } else {
      this.currentState = FSM_STATES.ERROR;
    }

    return this.getResult();
  }

  // Tokenize command string
  tokenizeCommand(commandString) {
    return commandString
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  // Handle invalid state transitions
  handleInvalidTransition(word, category) {
    const currentState = this.currentState;
    
    // Generate context-specific error messages
    switch (currentState) {
      case FSM_STATES.START:
        if (category === 'UNKNOWN') {
          this.addError(`"${word}" is not a recognized word`);
        } else {
          this.addError(`Commands must start with a verb like "draw" or "make"`);
          this.addSuggestion(`Try: "draw ${word}"`);
        }
        break;
        
      case FSM_STATES.COMMAND:
        if (category === 'COMMAND') {
          this.addError(`Don't repeat the command word`);
        } else if (category === 'UNKNOWN') {
          this.addError(`"${word}" is not a recognized word`);
        } else {
          this.addError(`Expected article, size, color, or shape after the command`);
        }
        break;
        
      case FSM_STATES.ARTICLE:
        if (category === 'ARTICLE') {
          this.addError(`Don't use multiple articles (a, an, the)`);
        } else if (category === 'COMMAND') {
          this.addError(`Already specified the command`);
        } else {
          this.addError(`Expected size, color, or shape after "${this.getLastWord()}"`);
        }
        break;
        
      case FSM_STATES.SIZE:
      case FSM_STATES.COLOR:
        if (category === 'SIZE' && currentState === FSM_STATES.SIZE) {
          this.addError(`Don't use multiple size words`);
        } else if (category === 'COLOR' && currentState === FSM_STATES.COLOR) {
          this.addError(`Don't use multiple color words`);
        } else if (category === 'SHAPE' || category === 'OBJECT') {
          // This shouldn't happen as these are valid transitions
          this.addError(`Expected a shape or object to draw`);
        } else {
          this.addError(`Expected a shape or object to draw`);
        }
        break;
        
      case FSM_STATES.SHAPE:
      case FSM_STATES.OBJECT:
        this.addError(`Command is already complete. Start a new command.`);
        break;
        
      default:
        this.addError(`Unexpected word: "${word}"`);
    }
  }

  // Check for common grammar mistakes
  checkCommonMistakes(commandString) {
    const lowerCommand = commandString.toLowerCase().trim();
    
    // Direct corrections
    if (COMMON_MISTAKES[lowerCommand]) {
      return COMMON_MISTAKES[lowerCommand];
    }

    // Pattern-based corrections
    let corrected = lowerCommand;
    
    // Add missing articles
    const articlePattern = /^(draw|make|create)\s+(circle|square|triangle|rectangle|house|tree|star)$/;
    if (articlePattern.test(corrected)) {
      corrected = corrected.replace(articlePattern, (match, verb, noun) => {
        const article = getCorrectArticle(noun);
        return `${verb} ${article} ${noun}`;
      });
    }

    return corrected;
  }

  // Check if current state is a valid end state
  isValidEndState() {
    return this.currentState === FSM_STATES.SHAPE || 
           this.currentState === FSM_STATES.OBJECT;
  }

  // Update parsed command object
  updateParsedCommand(word, category) {
    switch (category) {
      case 'COMMAND':
        this.parsedCommand.action = word;
        break;
      case 'ARTICLE':
        this.parsedCommand.article = word;
        break;
      case 'SIZE':
        this.parsedCommand.size = word;
        break;
      case 'COLOR':
        this.parsedCommand.color = word;
        break;
      case 'SHAPE':
        this.parsedCommand.type = word;
        this.parsedCommand.category = 'shape';
        break;
      case 'OBJECT':
        this.parsedCommand.type = word;
        this.parsedCommand.category = 'object';
        break;
    }
  }

  // Finalize parsed command with defaults
  finalizeParsedCommand() {
    // Set defaults if not specified
    if (!this.parsedCommand.color) {
      this.parsedCommand.color = '#333333'; // default dark gray
    } else {
      this.parsedCommand.color = this.getColorHex(this.parsedCommand.color);
    }
    
    if (!this.parsedCommand.size) {
      this.parsedCommand.size = 'medium';
    }

    if (!this.parsedCommand.action) {
      this.parsedCommand.action = 'draw';
    }

    // Add timestamp and ID
    this.parsedCommand.id = Date.now() + Math.random();
    this.parsedCommand.timestamp = new Date().toISOString();
  }

  // Convert color name to hex
  getColorHex(colorName) {
    const colorMap = {
      red: '#FF0000', blue: '#0000FF', green: '#008000', yellow: '#FFFF00',
      orange: '#FFA500', purple: '#800080', pink: '#FFC0CB', black: '#000000',
      white: '#FFFFFF', gray: '#808080', grey: '#808080', brown: '#A52A2A',
      cyan: '#00FFFF', magenta: '#FF00FF', lime: '#00FF00', navy: '#000080',
      maroon: '#800000', olive: '#808000', teal: '#008080', silver: '#C0C0C0',
      gold: '#FFD700'
    };
    
    return colorMap[colorName.toLowerCase()] || '#333333';
  }

  // Add error message
  addError(message) {
    this.errors.push(message);
  }

  // Add suggestion
  addSuggestion(message) {
    this.suggestions.push(message);
  }

  // Get last processed word
  getLastWord() {
    return this.processedTokens.length > 0 
      ? this.processedTokens[this.processedTokens.length - 1].word 
      : '';
  }

  // Get FSM result
  getResult() {
    return {
      isValid: this.currentState === FSM_STATES.END,
      currentState: this.currentState,
      errors: this.errors,
      suggestions: this.suggestions,
      processedTokens: this.processedTokens,
      parsedCommand: this.parsedCommand,
      canDraw: this.currentState === FSM_STATES.END && Object.keys(this.parsedCommand).length > 0
    };
  }

  // Get available next words based on current state
  getNextWordSuggestions() {
    const levelVocab = getLevelVocabulary(this.level);
    const validTransitions = STATE_TRANSITIONS[this.currentState] || {};
    
    const suggestions = [];
    
    Object.keys(validTransitions).forEach(category => {
      if (levelVocab[category]) {
        suggestions.push(...levelVocab[category]);
      }
    });

    return suggestions;
  }
}

// Factory function to create FSM instance
export const createFSM = (level = 1) => {
  return new FSMEngine(level);
};

// Utility function to validate command quickly
export const validateCommand = (commandString, level = 1) => {
  const fsm = createFSM(level);
  return fsm.processCommand(commandString);
};

export default FSMEngine;