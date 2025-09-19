from typing import Dict, List, Any
from .grammar import (
    categorize_word, 
    get_level_vocabulary, 
    is_word_valid_for_level, 
    LEVEL_VOCABULARY, 
    COMMON_MISTAKES,
    COMPOUND_COLORS,
    COMPOUND_SIZES
)


def find_word_level(word: str):
    w = (word or "").lower()
    for lvl, spec in LEVEL_VOCABULARY.items():
        for lst in spec.values():
            if isinstance(lst, list) and w in [x.lower() for x in lst]:
                return int(lvl)
    return None


def levenshtein(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1):
        dp[i][0] = i
    for j in range(len(b) + 1):
        dp[0][j] = j
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )
    return dp[len(a)][len(b)]


def find_closest_matches(word: str, candidates: list[str], max_distance: int = 2) -> list[tuple[str, int]]:
    """
    Find the closest matching words within a maximum Levenshtein distance.
    Returns a list of (word, distance) tuples sorted by distance.
    """
    if not word or not candidates:
        return []
    
    word = word.lower()
    matches = []
    for candidate in candidates:
        candidate_lower = candidate.lower()
        if candidate_lower == word:
            continue
        # Quick check: if length difference is too big, skip detailed comparison
        if abs(len(word) - len(candidate_lower)) > max_distance:
            continue
        # Check prefix match first (faster than Levenshtein)
        prefix = word[:max(1, min(3, len(word)))]
        if candidate_lower.startswith(prefix) or prefix in candidate_lower:
            distance = levenshtein(word, candidate_lower)
            if distance <= max_distance:
                matches.append((candidate, distance))
        else:
            # Only compute Levenshtein if really needed
            distance = levenshtein(word, candidate_lower)
            if distance <= max_distance:
                matches.append((candidate, distance))
    
    return sorted(matches, key=lambda x: (x[1], x[0]))

def suggest_similar_words(word: str, level: int = 1, limit: int = 3) -> List[str]:
    w = (word or "").lower()
    vocab = get_level_vocabulary(level)
    candidate_lists = [vocab.get("SHAPES", []), vocab.get("OBJECTS", [])]
    
    all_candidates = []
    for lst in candidate_lists:
        all_candidates.extend(lst)
        
    matches = find_closest_matches(w, all_candidates, max_distance=2)
    return [word for word, _ in matches[:limit]]


def get_closest_word(word: str, level: int = 1):
    candidates = suggest_similar_words(word, level, 5)
    return candidates[0] if candidates else None


def try_compound_word_correction(tokens: List[str], current_level: int) -> List[Dict[str, str]]:
    """Try to detect and correct compound word combinations."""
    replacements = []
    for i in range(len(tokens) - 1):
        compound = f"{tokens[i]} {tokens[i+1]}"
        compound_lower = compound.lower()
        
        # Check for exact compound word matches
        if compound_lower in (color.lower() for color in COMPOUND_COLORS.keys()):
            replacements.append({
                "original": tokens[i],
                "original_next": tokens[i+1],
                "replacement": compound,
                "type": "color"
            })
            continue
            
        if compound_lower in (size.lower() for size in COMPOUND_SIZES.keys()):
            replacements.append({
                "original": tokens[i],
                "original_next": tokens[i+1],
                "replacement": compound,
                "type": "size"
            })
            continue
            
        # Check for possible compound colors/sizes even if not exact match
        color_words = {"light", "dark", "deep", "hot", "sky", "sea", "forest", "navy"}
        base_colors = {"red", "blue", "green", "yellow", "purple", "pink"}
        if (tokens[i].lower() in color_words and tokens[i+1].lower() in base_colors):
            replacements.append({
                "original": tokens[i],
                "original_next": tokens[i+1],
                "replacement": compound,
                "type": "color",
                "suggestion": f'Try using "{compound}" as a compound color'
            })
            
    return replacements

def analyze_command(command_text: str = "", current_level: int = 1, fsm_result: Dict[str, Any] | None = None) -> Dict[str, Any]:
    raw = str(command_text or "").strip()
    lc = raw.lower()
    tokens = [t for t in lc.split() if t]
    
    feedback: Dict[str, Any] = {"type": "info", "message": "Analyzing command...", "suggestions": []}
    
    # Check for potential compound words first
    compound_suggestions = try_compound_word_correction(tokens, current_level)
    if compound_suggestions:
        corrected = " ".join(tokens)
        for suggestion in compound_suggestions:
            new_phrase = suggestion["replacement"]
            old_phrase = f"{suggestion['original']} {suggestion['original_next']}"
            corrected = corrected.replace(old_phrase, new_phrase)
            feedback["suggestions"].append(f'Try using "{new_phrase}" as a compound {suggestion["type"]}')

    feedback: Dict[str, Any] = {"type": "info", "message": "Analyzing command...", "suggestions": []}

    if lc in COMMON_MISTAKES and COMMON_MISTAKES[lc] != lc:
        feedback["type"] = "warning"
        feedback["message"] = f'Did you mean: "{COMMON_MISTAKES[lc]}"?'
        feedback["suggestions"].append(COMMON_MISTAKES[lc])
        return feedback

    if fsm_result and fsm_result.get("isValid") and fsm_result.get("canDraw"):
        parsed = fsm_result.get("parsedCommand", {})
        feedback["type"] = "success"
        feedback["message"] = (
            f"Good command — drew {parsed.get('color', '')} {parsed.get('size', '')} {parsed.get('type', '')}"
        ).replace("\n", " ").replace("  ", " ").strip()
        level_vocab = get_level_vocabulary(current_level)
        has_color = any(t in (level_vocab.get("COLORS") or []) for t in tokens)
        if not has_color and (level_vocab.get("COLORS") or []):
            feedback["suggestions"].append(f"Try specifying a color, e.g. '{(level_vocab['COLORS'] or [''])[0]}'")
        has_size = any(t in (level_vocab.get("SIZES") or []) for t in tokens)
        if not has_size and (level_vocab.get("SIZES") or []):
            feedback["suggestions"].append(f"You can add size words like '{(level_vocab['SIZES'] or [''])[0]}'")
        feedback["suggestions"].append('Try combining colors and sizes: "draw a small blue circle"')
        return feedback

    if fsm_result and isinstance(fsm_result.get("errors"), list) and fsm_result["errors"]:
        feedback["type"] = "error"
        feedback["message"] = fsm_result["errors"][0] or "Invalid command"

        unknowns = [t for t in tokens if categorize_word(t) == "UNKNOWN"]
        replacement_suggestions: List[Dict[str, str]] = []
        if unknowns:
            for u in unknowns:
                lvl = find_word_level(u)
                if lvl and lvl > current_level:
                    feedback["suggestions"].append(
                        f'"{u}" is introduced in level {lvl}. Try shapes/colors available in level {current_level}.'
                    )
                else:
                    sim = suggest_similar_words(u, current_level)
                    if sim:
                        feedback["suggestions"].append(f"Did you mean {' or '.join(sim[:3])}?")
                        closest = sim[0]
                        if closest:
                            replacement_suggestions.append({"original": u, "replacement": closest})
                    else:
                        closest = get_closest_word(u, current_level)
                        if closest:
                            replacement_suggestions.append({"original": u, "replacement": closest})

        if replacement_suggestions:
            corrected = " ".join(tokens)
            for r in replacement_suggestions:
                corrected = " ".join([r["replacement"] if tok == r["original"] else tok for tok in corrected.split()])
            if corrected != lc:
                feedback["suggestions"].insert(0, f'Did you mean: "{corrected}"?')

        # Check each token for level validity with its category
        invalid_for_level = []
        for t in tokens:
            category = categorize_word(t)
            is_valid, _ = is_word_valid_for_level(t, category, current_level)
            if not is_valid:
                invalid_for_level.append(t)

        for t in invalid_for_level:
            lvl = find_word_level(t)
            if lvl and lvl > current_level:
                feedback["suggestions"].append(f'"{t}" becomes available at level {lvl}. Keep practicing to unlock it.')

        fsm_suggestions = fsm_result.get("suggestions") or []
        if fsm_suggestions:
            feedback["suggestions"].extend(fsm_suggestions[:3])

        if not feedback["suggestions"]:
            feedback["suggestions"].extend(['Try: "draw a red circle"', 'Try: "make a blue square"'])

        seen = set()
        filtered = []
        for s in feedback["suggestions"]:
            normalized = s.lower()
            if lc in normalized:
                continue
            if normalized in seen:
                continue
            seen.add(normalized)
            filtered.append(s)
        feedback["suggestions"] = filtered
        return feedback

    feedback["type"] = "info"
    feedback["message"] = "I could not fully parse that command."
    feedback["suggestions"].extend(['Try: "draw a red circle"', 'Try using an article: "draw a circle"'])
    return feedback
