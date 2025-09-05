// Grammar categories and vocabulary for English drawing commands

export const GRAMMAR_CATEGORIES = {
  COMMANDS: ['draw', 'make', 'create', 'paint', 'sketch', 'add', 'put', 'place'],
  ARTICLES: ['a', 'an', 'the'],
  SIZES: ['small', 'tiny', 'little', 'medium', 'normal', 'regular', 'large', 'big', 'huge', 'giant'],
  COLORS: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'grey', 'brown', 'cyan', 'magenta', 'lime', 'navy', 'maroon', 'olive', 'teal', 'silver', 'gold'],
  SHAPES: ['circle', 'square', 'rectangle', 'triangle', 'line', 'oval', 'diamond'],
  OBJECTS: ['house', 'tree', 'car', 'star', 'heart', 'flower', 'sun', 'moon', 'cloud', 'mountain', 'boat', 'fish', 'bird', 'cat', 'dog'],
  PREPOSITIONS: ['on', 'in', 'at', 'by', 'near', 'above', 'below', 'beside', 'next to'],
  CONJUNCTIONS: ['and', 'then', 'also', 'plus']
};

export const GRAMMAR_PATTERNS = [
  ['COMMAND', 'ARTICLE', 'SHAPE'],
  ['COMMAND', 'ARTICLE', 'OBJECT'],
  ['COMMAND', 'ARTICLE', 'COLOR', 'SHAPE'],
  ['COMMAND', 'ARTICLE', 'COLOR', 'OBJECT'],
  ['COMMAND', 'ARTICLE', 'SIZE', 'SHAPE'],
  ['COMMAND', 'ARTICLE', 'SIZE', 'OBJECT'],
  ['COMMAND', 'ARTICLE', 'SIZE', 'COLOR', 'SHAPE'],
  ['COMMAND', 'ARTICLE', 'COLOR', 'SIZE', 'SHAPE'],
  ['COMMAND', 'ARTICLE', 'SIZE', 'COLOR', 'OBJECT'],
  ['COMMAND', 'ARTICLE', 'COLOR', 'SIZE', 'OBJECT'],
  ['COMMAND', 'SHAPE'],
  ['COMMAND', 'OBJECT'],
  ['COMMAND', 'COLOR', 'SHAPE'],
  ['COMMAND', 'SIZE', 'SHAPE'],
  ['COMMAND', 'SIZE', 'COLOR', 'SHAPE'],
  ['COMMAND', 'COLOR', 'SIZE', 'SHAPE']
];

export const LEVEL_VOCABULARY = {
  1: { COMMANDS: ['draw', 'make'], ARTICLES: ['a'], COLORS: ['red', 'blue', 'green', 'yellow'], SHAPES: ['circle', 'square'], OBJECTS: [] },
  2: { COMMANDS: ['draw', 'make', 'create'], ARTICLES: ['a', 'the'], COLORS: ['red', 'blue', 'green', 'yellow', 'orange', 'purple'], SHAPES: ['circle', 'square', 'triangle', 'rectangle'], OBJECTS: [] },
  3: { COMMANDS: ['draw', 'make', 'create', 'paint'], ARTICLES: ['a', 'an', 'the'], COLORS: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white'], SIZES: ['small', 'big', 'large'], SHAPES: ['circle', 'square', 'triangle', 'rectangle', 'line'], OBJECTS: ['house', 'tree', 'star'] },
  4: { ...GRAMMAR_CATEGORIES }
};

export const COMMON_MISTAKES = {
  'draw circle': 'draw a circle',
  'make square': 'make a square',
  'create house': 'create a house',
  'draw an square': 'draw a square',
  'make an triangle': 'make a triangle',
  'draw circle red': 'draw a red circle',
  'make house big': 'make a big house',
  'create square blue small': 'create a small blue square',
  'a red circle': 'draw a red circle',
  'blue house': 'make a blue house',
  'gimme a circle': 'draw a circle',
  'put circle': 'draw a circle'
};

// map plural keys to singular token names used in GRAMMAR_PATTERNS/FSM
const CATEGORY_NAME_MAP = {
  COMMANDS: 'COMMAND',
  ARTICLES: 'ARTICLE',
  SIZES: 'SIZE',
  COLORS: 'COLOR',
  SHAPES: 'SHAPE',
  OBJECTS: 'OBJECT',
  PREPOSITIONS: 'PREPOSITION',
  CONJUNCTIONS: 'CONJUNCTION'
};

// categorizeWord: returns singular token name or 'UNKNOWN'
export const categorizeWord = (word) => {
  if (!word || typeof word !== 'string') return 'UNKNOWN';
  const w = word.toLowerCase();

  // 1) check GRAMMAR_CATEGORIES (full vocabulary)
  for (const [cat, list] of Object.entries(GRAMMAR_CATEGORIES)) {
    if (list.includes(w)) return CATEGORY_NAME_MAP[cat] || cat;
  }

  // 2) check level-specific vocab as fallback (any level)
  for (const levelSpec of Object.values(LEVEL_VOCABULARY)) {
    for (const [cat, list] of Object.entries(levelSpec)) {
      if (Array.isArray(list) && list.includes(w)) return CATEGORY_NAME_MAP[cat] || cat;
    }
  }

  return 'UNKNOWN';
};

// returns merged vocabulary for a given level (fills missing from GRAMMAR_CATEGORIES)
export const getLevelVocabulary = (level = 1) => {
  const base = {};
  // initialize with GRAMMAR_CATEGORIES
  for (const [k, v] of Object.entries(GRAMMAR_CATEGORIES)) base[k] = Array.isArray(v) ? [...v] : [];

  const levelSpec = LEVEL_VOCABULARY[level] || {};
  for (const [k, v] of Object.entries(levelSpec)) {
    base[k] = Array.isArray(v) ? Array.from(new Set([...(base[k] || []), ...v])) : base[k];
  }
  return base;
};

// check if word exists in vocabulary for given level
export const isWordValidForLevel = (word, level = 1) => {
  if (!word) return false;
  const vocab = getLevelVocabulary(level);
  const w = word.toLowerCase();
  for (const list of Object.values(vocab)) {
    if (Array.isArray(list) && list.includes(w)) return true;
  }
  return false;
};

// suggest correct article for next word (simple heuristic)
export const getCorrectArticle = (nextWord = '') => {
  if (!nextWord) return 'a';
  const first = nextWord.trim()[0]?.toLowerCase();
  if (!first) return 'a';
  return 'aeiou'.includes(first) ? 'an' : 'a';
};

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