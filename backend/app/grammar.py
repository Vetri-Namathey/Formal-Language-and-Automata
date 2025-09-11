from typing import Dict, List

GRAMMAR_CATEGORIES: Dict[str, List[str]] = {
    "COMMANDS": ["draw", "make", "create", "paint", "sketch", "add", "put", "place"],
    "ARTICLES": ["a", "an", "the"],
    "SIZES": ["small", "tiny", "little", "medium", "normal", "regular", "large", "big", "huge", "giant"],
    "COLORS": [
        "red", "blue", "green", "yellow", "orange", "purple", "pink", "black", "white",
        "gray", "grey", "brown", "cyan", "magenta", "lime", "navy", "maroon", "olive", "teal", "silver", "gold"
    ],
    "SHAPES": ["circle", "square", "rectangle", "triangle", "line", "oval", "diamond"],
    "OBJECTS": [
        "house", "tree", "car", "star", "heart", "flower", "sun", "moon", "cloud",
        "mountain", "boat", "fish", "bird", "cat", "dog"
    ],
    "PREPOSITIONS": ["on", "in", "at", "by", "near", "above", "below", "beside", "next to"],
    "CONJUNCTIONS": ["and", "then", "also", "plus"],
}

GRAMMAR_PATTERNS: List[List[str]] = [
    ["COMMAND", "ARTICLE", "SHAPE"],
    ["COMMAND", "ARTICLE", "OBJECT"],
    ["COMMAND", "ARTICLE", "COLOR", "SHAPE"],
    ["COMMAND", "ARTICLE", "COLOR", "OBJECT"],
    ["COMMAND", "ARTICLE", "SIZE", "SHAPE"],
    ["COMMAND", "ARTICLE", "SIZE", "OBJECT"],
    ["COMMAND", "ARTICLE", "SIZE", "COLOR", "SHAPE"],
    ["COMMAND", "ARTICLE", "COLOR", "SIZE", "SHAPE"],
    ["COMMAND", "ARTICLE", "SIZE", "COLOR", "OBJECT"],
    ["COMMAND", "ARTICLE", "COLOR", "SIZE", "OBJECT"],
    ["COMMAND", "SHAPE"],
    ["COMMAND", "OBJECT"],
    ["COMMAND", "COLOR", "SHAPE"],
    ["COMMAND", "SIZE", "SHAPE"],
    ["COMMAND", "SIZE", "COLOR", "SHAPE"],
    ["COMMAND", "COLOR", "SIZE", "SHAPE"],
]

LEVEL_VOCABULARY: Dict[int, Dict[str, List[str]]] = {
    1: {"COMMANDS": ["draw", "make"], "ARTICLES": ["a"], "COLORS": ["red", "blue", "green", "yellow"], "SHAPES": ["circle", "square"], "OBJECTS": []},
    2: {"COMMANDS": ["draw", "make", "create"], "ARTICLES": ["a", "the"], "COLORS": ["red", "blue", "green", "yellow", "orange", "purple"], "SHAPES": ["circle", "square", "triangle", "rectangle"], "OBJECTS": []},
    3: {"COMMANDS": ["draw", "make", "create", "paint"], "ARTICLES": ["a", "an", "the"], "COLORS": ["red", "blue", "green", "yellow", "orange", "purple", "pink", "black", "white"], "SIZES": ["small", "big", "large"], "SHAPES": ["circle", "square", "triangle", "rectangle", "line"], "OBJECTS": ["house", "tree", "star"]},
    4: {"COMMANDS": ["draw", "make", "create", "paint", "sketch", "add"], "ARTICLES": ["a", "an", "the"], "COLORS": ["red", "blue", "green", "yellow", "orange", "purple", "pink", "black", "white", "gray", "grey", "brown", "cyan", "magenta"], "SIZES": ["small", "tiny", "medium", "big", "large", "huge"], "SHAPES": ["circle", "square", "triangle", "rectangle", "line", "oval", "diamond"], "OBJECTS": ["house", "tree", "star", "car", "heart", "flower", "sun", "moon"]},
    5: GRAMMAR_CATEGORIES,
}

CATEGORY_NAME_MAP = {
    "COMMANDS": "COMMAND",
    "ARTICLES": "ARTICLE",
    "SIZES": "SIZE",
    "COLORS": "COLOR",
    "SHAPES": "SHAPE",
    "OBJECTS": "OBJECT",
    "PREPOSITIONS": "PREPOSITION",
    "CONJUNCTIONS": "CONJUNCTION",
}

def categorize_word(word: str) -> str:
    if not word or not isinstance(word, str):
        return "UNKNOWN"
    w = word.lower()
    # 1) check full vocabulary
    for cat, lst in GRAMMAR_CATEGORIES.items():
        if w in lst:
            return CATEGORY_NAME_MAP.get(cat, cat)
    # 2) fallback to any level list
    for spec in LEVEL_VOCABULARY.values():
        for cat, lst in spec.items():
            if isinstance(lst, list) and w in lst:
                return CATEGORY_NAME_MAP.get(cat, cat)
    return "UNKNOWN"

def get_level_vocabulary(level: int = 1) -> Dict[str, List[str]]:
    # Strict level-only vocabulary (no implicit merge with global), but fill missing keys with empty lists
    base: Dict[str, List[str]] = {k: [] for k in GRAMMAR_CATEGORIES.keys()}
    level_spec = LEVEL_VOCABULARY.get(level, {})
    for k, v in level_spec.items():
        base[k] = list(dict.fromkeys(v)) if isinstance(v, list) else base[k]
    return base

def is_word_valid_for_level(word: str, level: int = 1) -> bool:
    if not word:
        return False
    vocab = get_level_vocabulary(level)
    w = word.lower()
    return any(isinstance(lst, list) and w in lst for lst in vocab.values())

def get_correct_article(next_word: str = "") -> str:
    if not next_word:
        return "a"
    first = next_word.strip()[:1].lower()
    if not first:
        return "a"
    return "an" if first in "aeiou" else "a"

COMMON_MISTAKES: Dict[str, str] = {
    "draw circle": "draw a circle",
    "make square": "make a square",
    "create house": "create a house",
    "draw an square": "draw a square",
    "make an triangle": "make a triangle",
    "draw circle red": "draw a red circle",
    "make house big": "make a big house",
    "create square blue small": "create a small blue square",
    "a red circle": "draw a red circle",
    "blue house": "make a blue house",
    "gimme a circle": "draw a circle",
    "put circle": "draw a circle",
}
