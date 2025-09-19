from typing import Dict, List, Tuple
import re

def is_article_valid_for_word(article: str, word: str) -> Tuple[bool, str]:
    """Check if an article is grammatically correct for a word."""
    if not word:
        return True, ""
    
    word = word.lower()
    article = article.lower()
    
    # Check for vowel sounds
    vowel_sound = word[0] in 'aeiou' or (
        word[0] == 'h' and len(word) > 1 and word[1] in 'aeiou'
    )
    
    if vowel_sound and article == "a":
        return False, f'Use "an" instead of "a" before "{word}"'
    elif not vowel_sound and article == "an":
        return False, f'Use "a" instead of "an" before "{word}"'
    
    return True, ""

def get_correct_article(word: str) -> str:
    """Get the correct article for a word based on its starting sound."""
    if not word:
        return "a"
    
    word = word.lower()
    vowel_sound = word[0] in 'aeiou' or (
        word[0] == 'h' and len(word) > 1 and word[1] in 'aeiou'
    )
    
    return "an" if vowel_sound else "a"

# Compound word definitions
COMPOUND_COLORS = {
    "light red": "lightred",
    "dark red": "darkred",
    "light blue": "lightblue",
    "dark blue": "darkblue",
    "light green": "lightgreen",
    "dark green": "darkgreen",
    "light yellow": "lightyellow",
    "dark yellow": "darkyellow",
    "sky blue": "skyblue",
    "navy blue": "navyblue",
    "forest green": "forestgreen",
    "sea green": "seagreen",
    "hot pink": "hotpink",
    "deep purple": "deeppurple",
    "light purple": "lightpurple",
    "light orange": "lightorange",
    "dark orange": "darkorange"
}

COMPOUND_SIZES = {
    "very small": "verysmall",
    "very big": "verybig",
    "very large": "verylarge",
    "extra small": "extrasmall",
    "extra large": "extralarge",
    "super big": "superbig",
    "super small": "supersmall"
}

COMPOUND_OBJECTS = {
    "pine tree": "pinetree",
    "palm tree": "palmtree",
    "apple tree": "appletree",
    "race car": "racecar",
    "sports car": "sportscar",
    "flying bird": "flyingbird",
    "farm house": "farmhouse",
    "beach house": "beachhouse",
    "full moon": "fullmoon",
    "half moon": "halfmoon",
    "rain cloud": "raincloud",
    "storm cloud": "stormcloud",
    "tall mountain": "tallmountain",
    "snow mountain": "snowmountain",
    "sail boat": "sailboat",
    "speed boat": "speedboat",
    "gold fish": "goldfish",
    "flying fish": "flyingfish",
    "blue bird": "bluebird",
    "black bird": "blackbird",
    "red bird": "redbird"
}

COMPOUND_SHAPES = {
    "long line": "longline",
    "short line": "shortline",
    "tall rectangle": "tallrectangle",
    "wide rectangle": "widerectangle",
    "round circle": "roundcircle",
    "perfect circle": "perfectcircle",
    "perfect square": "perfectsquare",
    "big triangle": "bigtriangle",
    "small triangle": "smalltriangle",
    "sharp triangle": "sharptriangle",
    "flat oval": "flatoval",
    "tall oval": "talloval",
    "pointed diamond": "pointeddiamond",
    "flat diamond": "flatdiamond"
}

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
    # Level 1: Basic shapes with core colors - Simple commands only
    1: {
        "COMMANDS": ["draw", "make"],  # Removed 'create' as it wasn't working in level 1
        "ARTICLES": ["a"],
        "COLORS": ["red", "blue", "green", "yellow"],
        "SHAPES": ["circle", "square"],
        "OBJECTS": [],  # No objects in level 1
        "SIZES": []     # No sizes in level 1
    },
    
    # Level 2: More shapes and colors - Introducing 'create' and 'the'
    2: {
        "COMMANDS": ["draw", "make", "create", "paint"],  # Added 'paint', moved 'create' here
        "ARTICLES": ["a", "the"],
        "COLORS": ["red", "blue", "green", "yellow", "orange", "purple", "pink"],
        "SHAPES": ["circle", "square", "triangle", "rectangle"],
        "OBJECTS": ["house", "tree"],  # Introducing basic objects
        "SIZES": ["small", "big"]      # Introducing basic sizes
    },
    
    # Level 3: Full shape set, more colors, and basic objects
    3: {
        "COMMANDS": ["draw", "make", "create", "paint", "sketch"],
        "ARTICLES": ["a", "an", "the"],
        "COLORS": [
            "red", "blue", "green", "yellow", "orange", "purple", 
            "pink", "black", "white", "gray", "brown"
        ],
        "SIZES": ["small", "medium", "big", "large"],
        "SHAPES": ["circle", "square", "triangle", "rectangle", "line", "oval"],
        "OBJECTS": ["house", "tree", "star", "heart", "sun", "moon"]
    },
    
    # Level 4: Advanced features - All basic colors, shapes, and objects
    4: {
        "COMMANDS": ["draw", "make", "create", "paint", "sketch", "add", "put"],
        "ARTICLES": ["a", "an", "the"],
        "COLORS": [
            "red", "blue", "green", "yellow", "orange", "purple", "pink",
            "black", "white", "gray", "grey", "brown", "cyan", "magenta", 
            "lime", "navy", "maroon", "olive", "teal"
        ],
        "SIZES": ["small", "tiny", "medium", "big", "large", "huge", "giant"],
        "SHAPES": ["circle", "square", "triangle", "rectangle", "line", "oval", "diamond"],
        "OBJECTS": [
            "house", "tree", "star", "heart", "sun", "moon", "cloud",
            "car", "flower", "mountain", "boat", "fish", "bird"
        ]
    },
    
    # Level 5: Everything - Full vocabulary and compound words
    5: GRAMMAR_CATEGORIES  # All possible commands, colors, shapes, and objects
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

def check_compound_word(words: List[str]) -> Tuple[bool, str, str]:
    """Check if a sequence of words forms a compound word."""
    if len(words) < 2:
        return False, "", ""
    
    compound = " ".join(words).lower()
    # Check for compound colors
    if compound in COMPOUND_COLORS:
        return True, compound, "COLOR"
    # Check for compound sizes
    if compound in COMPOUND_SIZES:
        return True, compound, "SIZE"
    return False, "", ""

def categorize_word(word: str) -> str:
    if not word or not isinstance(word, str):
        return "UNKNOWN"
    w = word.lower()
    # 1) check full vocabulary
    for cat, lst in GRAMMAR_CATEGORIES.items():
        if w in lst:
            return CATEGORY_NAME_MAP.get(cat, cat)
    # 2) check compound words list
    for compound in COMPOUND_COLORS.values():
        if w == compound.lower():
            return "COLOR"
    for compound in COMPOUND_SIZES.values():
        if w == compound.lower():
            return "SIZE"
    # 3) fallback to any level list
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

def is_word_valid_for_level(word: str, category: str, level: int) -> Tuple[bool, str]:
    """Check if a word is valid for the current level."""
    if category == "ARTICLE":  # Articles are valid at all levels
        if word.lower() in GRAMMAR_CATEGORIES["ARTICLES"]:
            return True, ""
        return False, f'"{word}" is not a valid article.'
        
    if not word or not isinstance(word, str):
        return False, f'"{word}" is not a valid word.'
        
    # Get vocabulary for the level
    level_vocab = get_level_vocabulary(level)
    
    # Find the category key (e.g., "COLORS" for "COLOR")
    cat_key = next((k for k, v in CATEGORY_NAME_MAP.items() if v == category), category + "S")
    
    # Check if the word or its expanded form is in the vocabulary
    w = word.lower()
    if cat_key in level_vocab:
        vocab_words = level_vocab[cat_key]
        if w in [v.lower() for v in vocab_words]:
            return True, ""
            
    # Check compound words
    if category == "COLOR":
        if any(w == v.lower() for v in COMPOUND_COLORS.values()):
            return True, ""
    elif category == "SIZE":
        if any(w == v.lower() for v in COMPOUND_SIZES.values()):
            return True, ""
    elif category == "OBJECT":
        if any(w == v.lower() for v in COMPOUND_OBJECTS.values()):
            return True, ""
    elif category == "SHAPE":
        if any(w == v.lower() for v in COMPOUND_SHAPES.values()):
            return True, ""
            
    return False, f'"{word}" is not available at level {level}.'

def starts_with_vowel_sound(word: str) -> bool:
    """
    Determine if a word starts with a vowel sound, considering exceptions.
    """
    if not word:
        return False
    
    word = word.lower()
    
    # Check special cases (words that don't follow the regular pattern)
    exceptions = {
        # Words starting with silent 'h'
        "hour", "honest", "honour",
        # Words starting with consonant sound despite vowel
        "one", "unicorn", "unique", "union", "university", "useful"
    }
    
    if word in exceptions:
        return not word.startswith(('one', 'uni', 'use'))
    
    # Regular vowel sound check
    return bool(re.match(r'^[aeiou]', word))

# Function moved to top of file

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
