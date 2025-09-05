import { categorizeWord, getLevelVocabulary, isWordValidForLevel, LEVEL_VOCABULARY, COMMON_MISTAKES } from './grammar.js';

// Simple utility: find first level where a word appears in LEVEL_VOCABULARY
const findWordLevel = (word) => {
  const w = (word || '').toLowerCase();
  for (const [lvl, spec] of Object.entries(LEVEL_VOCABULARY)) {
    for (const list of Object.values(spec)) {
      if (Array.isArray(list) && list.map(x => x.toLowerCase()).includes(w)) return Number(lvl);
    }
  }
  return null;
};

// Find a few similar words from level vocab (startsWith or includes)
const suggestSimilarWords = (word, level = 1, limit = 3) => {
  const w = (word || '').toLowerCase();
  const vocab = getLevelVocabulary(level);
  const pool = [];
  for (const list of Object.values(vocab)) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const it = item.toLowerCase();
      if (it === w) continue;
      if (it.startsWith(w) || it.includes(w.slice(0, Math.max(1, Math.min(3, w.length))))) pool.push(item);
    }
  }
  return Array.from(new Set(pool)).slice(0, limit);
};

// Main analyzer
export const analyzeCommand = (commandText = '', currentLevel = 1, fsmResult = {}) => {
  const raw = (commandText || '').toString().trim();
  const lc = raw.toLowerCase();
  const tokens = lc.split(/\s+/).filter(Boolean);
  const categories = tokens.map(t => categorizeWord(t));

  // Base feedback structure
  const feedback = {
    type: 'info',
    message: 'Analyzing command...',
    suggestions: []
  };

  // 1) Common mistake quick-fix lookup
  if (COMMON_MISTAKES[lc]) {
    feedback.type = 'warning';
    feedback.message = `Did you mean: "${COMMON_MISTAKES[lc]}"?`;
    feedback.suggestions.push(COMMON_MISTAKES[lc]);
    return feedback;
  }

  // 2) If FSM says valid and can draw, give encouraging, next-step hints
  if (fsmResult && fsmResult.isValid && fsmResult.canDraw) {
    const parsed = fsmResult.parsedCommand || {};
    feedback.type = 'success';
    feedback.message = `Good command — drew ${parsed.color || ''} ${parsed.size || ''} ${parsed.type || ''}`.replace(/\s+/g, ' ').trim();

    // If color missing but allowed in level, suggest adding a color
    const levelVocab = getLevelVocabulary(currentLevel);
    const hasColorInCommand = tokens.some(t => (levelVocab.COLORS || []).includes(t));
    if (!hasColorInCommand && (levelVocab.COLORS || []).length > 0) {
      feedback.suggestions.push(`Try specifying a color, e.g. '${(levelVocab.COLORS || [])[0]}'`);
    }

    // Suggest size option if available
    const hasSize = tokens.some(t => (levelVocab.SIZES || []).includes(t));
    if (!hasSize && (levelVocab.SIZES || []).length > 0) {
      feedback.suggestions.push(`You can add size words like '${(levelVocab.SIZES || [])[0]}'`);
    }

    // Add a gentle challenge
    feedback.suggestions.push('Try combining colors and sizes: "draw a small blue circle"');
    return feedback;
  }

  // 3) If FSM reported errors, prioritize them and add contextual help
  if (fsmResult && Array.isArray(fsmResult.errors) && fsmResult.errors.length > 0) {
    feedback.type = 'error';
    feedback.message = fsmResult.errors[0] || 'Invalid command';

    // If unknown tokens present, locate which and give level hints
    const unknowns = tokens.filter(t => categorizeWord(t) === 'UNKNOWN');
    if (unknowns.length) {
      for (const u of unknowns) {
        const lvl = findWordLevel(u);
        if (lvl && lvl > currentLevel) {
          feedback.suggestions.push(`"${u}" is introduced in level ${lvl}. Try shapes/colors available in level ${currentLevel}.`);
        } else {
          const sim = suggestSimilarWords(u, currentLevel);
          if (sim.length) feedback.suggestions.push(`Did you mean ${sim.slice(0,3).join(' or ')}?`);
        }
      }
    }

    // If a token is valid but not allowed for the level, point to the level
    const invalidForLevel = tokens.filter(t => !isWordValidForLevel(t, currentLevel));
    for (const t of invalidForLevel) {
      const lvl = findWordLevel(t);
      if (lvl && lvl > currentLevel) {
        feedback.suggestions.push(`"${t}" becomes available at level ${lvl}. Keep practicing to unlock it.`);
      }
    }

    // If FSM provided suggestions (from grammar or common mistakes), merge them
    if (Array.isArray(fsmResult.suggestions) && fsmResult.suggestions.length > 0) {
      feedback.suggestions.push(...fsmResult.suggestions.slice(0,3));
    }

    // Fallback friendly examples
    if (feedback.suggestions.length === 0) {
      feedback.suggestions.push('Try: "draw a red circle"', 'Try: "make a blue square"');
    }

    return feedback;
  }

  // 4) Default guidance when nothing else matched
  feedback.type = 'info';
  feedback.message = 'I could not fully parse that command.';
  feedback.suggestions.push('Try: "draw a red circle"', 'Try using an article: "draw a circle"');
  return feedback;
};

export default { analyzeCommand };
