// Grammar categories and vocabulary for English drawing commands

export const GRAMMAR_CATEGORIES = {
  // Command verbs - how to start a drawing command
  COMMANDS: [
    'draw', 'make', 'create', 'paint', 'sketch', 'add', 'put', 'place'
  ],
  
  // Articles - grammatical determiners
  ARTICLES: [
    'a', 'an', 'the'
  ],
  
  // Size adjectives
  SIZES: [
    'small', 'tiny', 'little',
    'medium', 'normal', 'regular',
    'large', 'big', 'huge', 'giant'
  ],
  
  // Color adjectives
  COLORS: [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
    'black', 'white', 'gray', 'grey', 'brown', 'cyan', 'magenta',
    'lime', 'navy', 'maroon', 'olive', 'teal', 'silver', 'gold'
  ],
  
  // Shape nouns - basic geometric shapes
  SHAPES: [
    'circle', 'square', 'rectangle', 'triangle', 'line', 'oval', 'diamond'
  ],
  
  // Object nouns - complex drawable objects
  OBJECTS: [
    'house', 'tree', 'car', 'star', 'heart', 'flower', 'sun', 'moon',
    'cloud', 'mountain', 'boat', 'fish', 'bird', 'cat', 'dog'
  ],
  
  // Prepositions for positioning (future feature)
  PREPOSITIONS: [
    'on', 'in', 'at', 'by', 'near', 'above', 'below', 'beside', 'next to'
  ],
  
  // Conjunctions for multiple commands
  CONJUNCTIONS: [
    'and', 'then', 'also', 'plus'
  ]
};

// Valid grammar patterns/structures
export const GRAMMAR_PATTERNS = [
  // Basic patterns
  ['COMMAND', 'ARTICLE', 'SHAPE'],           // "draw a circle"
  ['COMMAND', 'ARTICLE', 'OBJECT'],          // "make a house"
  
  // With color
  ['COMMAND', 'ARTICLE', 'COLOR', 'SHAPE'],  // "draw a red circle"
  ['COMMAND', 'ARTICLE', 'COLOR', 'OBJECT'], // "make a blue house"
  
  // With size
  ['COMMAND', 'ARTICLE', 'SIZE', 'SHAPE'],   // "draw a big circle"
  ['COMMAND', 'ARTICLE', 'SIZE', 'OBJECT'],  // "make a small house"
  
  // With both size and color
  ['COMMAND', 'ARTICLE', 'SIZE', 'COLOR', 'SHAPE'],  // "draw a big red circle"
  ['COMMAND', 'ARTICLE', 'COLOR', 'SIZE', 'SHAPE'],  // "draw a red big circle"
  ['COMMAND', 'ARTICLE', 'SIZE', 'COLOR', 'OBJECT'], // "make a small blue house"
  ['COMMAND', 'ARTICLE', 'COLOR', 'SIZE', 'OBJECT'], // "make a blue small house"
  
  // Without articles (less formal but valid)
  ['COMMAND', 'SHAPE'],                      // "draw circle"
  ['COMMAND', 'OBJECT'],                     // "make house"
  ['COMMAND', 'COLOR', 'SHAPE'],             // "draw red circle"
  ['COMMAND', 'SIZE', 'SHAPE'],              // "draw big circle"
  ['COMMAND', 'SIZE', 'COLOR', 'SHAPE'],     // "draw big red circle"
  ['COMMAND', 'COLOR', 'SIZE', 'SHAPE'],     // "draw red big circle"
];

// Level-specific vocabulary (for progressive learning)
export const LEVEL_VOCABULARY = {
  1: { // Beginner - basic shapes and colors
    COMMANDS: ['draw', 'make'],
    ARTICLES: ['a'],
    COLORS: ['red', 'blue', 'green', 'yellow'],
    SHAPES: ['circle', 'square'],
    OBJECTS: []
  },
  
  2: { // Elementary - more shapes
    COMMANDS: ['draw', 'make', 'create'],
    ARTICLES: ['a', 'the'],
    COLORS: ['red', 'blue', 'green', 'yellow', 'orange', 'purple'],
    SHAPES: ['circle', 'square', 'triangle', 'rectangle'],
    OBJECTS: []
  },
  
  3: { // Intermediate - sizes and objects
    COMMANDS: ['draw', 'make', 'create', 'paint'],
    ARTICLES: ['a', 'an', 'the'],
    COLORS: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white'],
    SIZES: ['small', 'big', 'large'],
    SHAPES: ['circle', 'square', 'triangle', 'rectangle', 'line'],
    OBJECTS: ['house', 'tree', 'star']
  },
  
  4: { // Advanced - full vocabulary
    ...GRAMMAR_CATEGORIES
  }
};

// Common grammar mistakes and their corrections
export const COMMON_MISTAKES = {
  // Missing articles
  'draw circle': 'draw a circle',
  'make square': 'make a square',
  'create house': 'create a house',
  
  // Wrong article usage
  'draw an square': 'draw a square',
  'make an triangle': 'make a triangle',
  
  // Word order issues
  'draw circle red': 'draw a red circle',
  'make house big': 'make a big house',
  'create square blue small': 'create a small blue square',
  
  // Missing command
  'a red circle': 'draw a red circle',
  'blue house': 'make a blue house',
  
  // Informal to formal
  'gimme a circle': 'draw a circle',
  'put circle': 'draw a circle'
};

// Function to categorize a word
export const categorizeWord = (word) => {
  const lowercaseWord = word.toLowerCase();
  
  for (const [category, words] of Object.entries(GRAMMAR_CATEGORIES)) {
    if (words.includes(lowercaseWord)) {
      return category;
    }
  }
  
  return 'UNKNOWN';
};

// Function to get vocabulary for specific level
export const getLevelVocabulary = (level) => {
  if (level <= 0 || level > 10) {
    return GRAMMAR_CATEGORIES;
  }
  
  // Map levels 5-10 to level 4 vocabulary (full vocabulary)
  const vocabularyLevel = Math.min(level, 4);
  return LEVEL_VOCABULARY[vocabularyLevel] || GRAMMAR_CATEGORIES;
};

// Function to check if word is valid for current level
export const isWordValidForLevel = (word, level) => {
  const levelVocab = getLevelVocabulary(level);
  const category = categorizeWord(word);
  
  if (category === 'UNKNOWN') {
    return false;
  }
  
  return levelVocab[category] && levelVocab[category].includes(word.toLowerCase());
};

// Function to suggest correct article usage
export const getCorrectArticle = (nextWord) => {
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const firstLetter = nextWord.toLowerCase().charAt(0);
  
  return vowels.includes(firstLetter) ? 'an' : 'a';
};

// Export all grammar rules
export default {
  GRAMMAR_CATEGORIES,
  GRAMMAR_PATTERNS,
  LEVEL_VOCABULARY,
  COMMON_MISTAKES,
  categorizeWord,
  getLevelVocabulary,
  isWordValidForLevel,
  getCorrectArticle
};