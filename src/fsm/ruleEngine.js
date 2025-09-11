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

// Levenshtein distance (small & fast for short vocab lists)
const levenshtein = (a, b) => {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
};

// Find a few similar words from level vocab (prefix/contains OR close edit distance), but only for SHAPES/OBJECTS
const suggestSimilarWords = (word, level = 1, limit = 3) => {
  const w = (word || '').toLowerCase();
  const vocab = getLevelVocabulary(level);
  const scored = [];
  const prefix = w.slice(0, Math.max(1, Math.min(3, w.length)));
  // Only consider SHAPES and OBJECTS for type suggestions
  const candidateLists = [vocab.SHAPES || [], vocab.OBJECTS || []];
  for (const list of candidateLists) {
    for (const item of list) {
      const it = item.toLowerCase();
      if (it === w) continue;
      // prefix/substring heuristic OR edit distance <=2
      if (it.startsWith(prefix) || it.includes(prefix) || levenshtein(w, it) <= 2) {
        const distance = levenshtein(w, it);
        scored.push({ word: item, distance });
      }
    }
  }
  // sort by distance then alpha
  scored.sort((a, b) => a.distance - b.distance || a.word.localeCompare(b.word));
  return Array.from(new Set(scored.map(s => s.word))).slice(0, limit);
};

// Pick the single closest candidate (used to reconstruct corrected command)
const getClosestWord = (word, level = 1) => {
  const candidates = suggestSimilarWords(word, level, 5);
  return candidates.length ? candidates[0] : null;
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
  if (COMMON_MISTAKES[lc] && COMMON_MISTAKES[lc] !== lc) {
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
    const replacementSuggestions = [];
    if (unknowns.length) {
      for (const u of unknowns) {
        const lvl = findWordLevel(u);
        if (lvl && lvl > currentLevel) {
          feedback.suggestions.push(`"${u}" is introduced in level ${lvl}. Try shapes/colors available in level ${currentLevel}.`);
        } else {
          const sim = suggestSimilarWords(u, currentLevel);
            if (sim.length) {
              feedback.suggestions.push(`Did you mean ${sim.slice(0,3).join(' or ')}?`);
              const closest = sim[0];
              if (closest) replacementSuggestions.push({ original: u, replacement: closest });
            } else {
              // Try a closest single candidate anyway
              const closest = getClosestWord(u, currentLevel);
              if (closest) replacementSuggestions.push({ original: u, replacement: closest });
            }
        }
      }
    }

    // Reconstruct a corrected command if we have viable replacements
    if (replacementSuggestions.length) {
      let corrected = tokens.join(' ');
      for (const r of replacementSuggestions) {
        // replace only whole word occurrences (simple split/join to avoid partial replacements)
        corrected = corrected.split(/\s+/).map(tok => tok === r.original ? r.replacement : tok).join(' ');
      }
      if (corrected !== lc) {
        feedback.suggestions.unshift(`Did you mean: "${corrected}"?`);
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
    // Remove any duplicate suggestions or suggestions identical to original command
    const seen = new Set();
    feedback.suggestions = feedback.suggestions.filter(s => {
      const normalized = s.toLowerCase();
      if (normalized.includes(lc)) return false; // avoid echoing original
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });

    return feedback;
  }

  // 4) Default guidance when nothing else matched
  feedback.type = 'info';
  feedback.message = 'I could not fully parse that command.';
  feedback.suggestions.push('Try: "draw a red circle"', 'Try using an article: "draw a circle"');
  return feedback;
};

export default { analyzeCommand };
