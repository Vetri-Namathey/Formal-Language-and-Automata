// src/services/normalizeService.js
// Normalizes translated English into the parser's expected vocabulary.

// Helper: replace tokens using a map, honoring word boundaries.
function replaceTokens(sentence, map) {
  let out = sentence;
  for (const [from, to] of Object.entries(map)) {
    // word-boundary, case-insensitive
    const re = new RegExp(`\\b${from}\\b`, 'gi');
    out = out.replace(re, to);
  }
  return out;
}

// Common polite/stop words to drop from the beginning
const DROP_PREFIXES = [
  'please',
  'could you',
  'can you',
  'will you',
  'kindly',
  'would you',
  'i want to',
  'i would like to',
];

// Synonyms for actions supported by the grammar (draw, make, create, paint, sketch, add)
const ACTION_MAP = {
  'render': 'draw',
  'place': 'add',
  'insert': 'add',
  'put': 'add',
};

// Color normalization (canonical basic colors). Extend as needed.
const COLOR_MAP = {
  'crimson': 'red',
  'scarlet': 'red',
  'ruby': 'red',
  'navy': 'blue',
  'azure': 'blue',
  'teal': 'cyan',
  'fuchsia': 'magenta',
  'violet': 'purple',
  'grey': 'gray',
  'brownish': 'brown',
  'limegreen': 'lime',
};

// Shape normalization to match game vocab (circle, square, triangle, rectangle, line, oval, diamond, ...)
const SHAPE_MAP = {
  'ellipse': 'oval',
  'rhombus': 'diamond',
  'rect': 'rectangle',
  'box': 'square',
  'round': 'circle',
};

// Size normalization
const SIZE_MAP = {
  'little': 'small',
  'tiny': 'small',
  'mini': 'small',
  'big': 'large', // keep big separately if parser expects; adjust if needed
  'huge': 'large',
  'giant': 'large',
  'massive': 'large',
  'medium-sized': 'medium',
};

export function normalizeEnglishForGrammar(input) {
  if (!input) return '';
  let text = String(input).trim();

  // Lowercase, strip trailing punctuation
  text = text.toLowerCase().replace(/[.?!]+$/, '');

  // Remove polite prefixes if present at start
  for (const pref of DROP_PREFIXES) {
    if (text.startsWith(pref + ' ')) {
      text = text.slice(pref.length + 1);
      break;
    }
  }

  // Remove leading articles
  text = text.replace(/^\b(a|an|the)\b\s+/i, '');

  // Normalize multiple spaces
  text = text.replace(/\s+/g, ' ').trim();

  // Token replacements
  text = replaceTokens(text, ACTION_MAP);
  text = replaceTokens(text, COLOR_MAP);
  text = replaceTokens(text, SHAPE_MAP);
  text = replaceTokens(text, SIZE_MAP);

  return text;
}

export default { normalizeEnglishForGrammar };
