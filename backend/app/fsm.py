from dataclasses import dataclass, field
from typing import List, Dict, Any
from .grammar import (
    categorize_word,
    get_level_vocabulary,
    is_word_valid_for_level,
    get_correct_article,
    is_article_valid_for_word,
    GRAMMAR_CATEGORIES,
    COMPOUND_COLORS,
    COMPOUND_SIZES,
    COMPOUND_OBJECTS,
    COMPOUND_SHAPES,
    COMMON_MISTAKES,
)
from .rule_engine import find_closest_matches

FSM_STATES = {
    "START": "START",
    "COMMAND": "COMMAND",
    "ARTICLE": "ARTICLE",
    "SIZE": "SIZE",
    "COLOR": "COLOR",
    "SHAPE": "SHAPE",
    "OBJECT": "OBJECT",
    "END": "END",
    "ERROR": "ERROR",
}

STATE_TRANSITIONS: Dict[str, Dict[str, str]] = {
    "START": {"COMMAND": "COMMAND"},
    "COMMAND": {"ARTICLE": "ARTICLE", "SIZE": "SIZE", "COLOR": "COLOR", "SHAPE": "SHAPE", "OBJECT": "OBJECT"},
    "ARTICLE": {"SIZE": "SIZE", "COLOR": "COLOR", "SHAPE": "SHAPE", "OBJECT": "OBJECT"},
    "SIZE": {"COLOR": "COLOR", "SHAPE": "SHAPE", "OBJECT": "OBJECT"},
    "COLOR": {"SIZE": "SIZE", "SHAPE": "SHAPE", "OBJECT": "OBJECT"},
    "SHAPE": {"END": "END"},
    "OBJECT": {"END": "END"},
}

@dataclass
class FSMResult:
    isValid: bool
    currentState: str
    errors: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    processedTokens: List[Dict[str, str]] = field(default_factory=list)
    parsedCommand: Dict[str, Any] = field(default_factory=dict)
    canDraw: bool = False

class FSMEngine:
    def __init__(self, level: int = 1) -> None:
        self.level = level
        self.compound_mapping = {}
        # Initialize compound mappings from imported dictionaries
        for compound, replacement in COMPOUND_COLORS.items():
            self.compound_mapping[compound] = (replacement, "COLOR")
        for compound, replacement in COMPOUND_SIZES.items():
            self.compound_mapping[compound] = (replacement, "SIZE")
        for compound, replacement in COMPOUND_OBJECTS.items():
            self.compound_mapping[compound] = (replacement, "OBJECT")
        for compound, replacement in COMPOUND_SHAPES.items():
            self.compound_mapping[compound] = (replacement, "SHAPE")
        self.reset()

    def reset(self) -> None:
        self.currentState = FSM_STATES["START"]
        self.processedTokens: List[Dict[str, str]] = []
        self.errors: List[str] = []
        self.suggestions: List[str] = []
        self.parsedCommand: Dict[str, Any] = {}
        self._tokens: List[str] = []  # Current command tokens
        self._current_token_index: int = -1

    def _peek_next_token(self) -> str:
        """Get the next token without consuming it."""
        if self._current_token_index + 1 < len(self._tokens):
            return self._tokens[self._current_token_index + 1]
        return ""

    def set_level(self, level: int) -> None:
        self.level = level

    def process_token(self, token: str) -> bool:
        word = token.lower().strip()
        compound_mapping = self._compound_mapping
        category = categorize_word(word)
        
        # Handle compound word validations
        is_compound = False
        original_compound = None
        for compound, (replacement, comp_category) in compound_mapping.items():
            if replacement.lower() == word:
                is_compound = True
                original_compound = compound
                break
                
        # 1. Check if the transition is valid first
        valid_transitions = STATE_TRANSITIONS.get(self.currentState, {})
        if category not in valid_transitions:
            self.handle_invalid_transition(word, category, is_compound, original_compound)
            return False
            
        # 2. Handle article grammar rules
        if category == "ARTICLE":
            next_token = self._peek_next_token()
            if next_token:
                # For compound words, check article against the full compound
                if next_token in [repl.lower() for repl, _ in compound_mapping.values()]:
                    # Find original compound
                    original_next = next((comp for comp, (repl, _) in compound_mapping.items() 
                                     if repl.lower() == next_token.lower()), next_token)
                    is_valid, suggestion = is_article_valid_for_word(word, original_next)
                else:
                    is_valid, suggestion = is_article_valid_for_word(word, next_token)
                    
                if not is_valid:
                    self.add_error(suggestion)
                    # If it's a grammatical error with "a"/"an", suggest the correction
                    next_word = original_next if next_token in [repl.lower() for repl, _ in compound_mapping.values()] else next_token
                    if "Use 'a' instead of 'an'" in suggestion or "Use 'an' instead of 'a'" in suggestion:
                        self.add_suggestion(f'Try: "{get_correct_article(next_word)} {next_word}"')
                    return False
                    
        # 3. Check level restrictions for both regular and compound words
        is_valid, message = is_word_valid_for_level(word, category, self.level)
        if not is_valid and category != "UNKNOWN":
            # For compounds, show the original form in error message
            if is_compound and original_compound:
                self.add_error(f'"{original_compound}" is not available in level {self.level}')
            else:
                self.add_error(message)
            # Suggest similar words from the current level
            suggestions = self.suggest_corrections(word)
            if suggestions:
                self.add_suggestion(f'Available words: {", ".join(suggestions)}')
            return False
        if category not in valid_transitions:
            self.handle_invalid_transition(word, category)
            return False

        self.currentState = valid_transitions[category]
        self.processedTokens.append({"word": word, "category": category})
        self.update_parsed_command(word, category)
        return True

    def process_command(self, command_string: str) -> FSMResult:
        self.reset()
        self._tokens = self.tokenize_command(command_string)
        if len(self._tokens) == 0:
            self.add_error("Please enter a command")
            return self.get_result()

        corrected = self.check_common_mistakes(command_string)
        if corrected != command_string:
            self.add_suggestion(f'Did you mean: "{corrected}"?')

        success = True
        for i, tok in enumerate(self._tokens):
            self._current_token_index = i
            if not self.process_token(tok):
                success = False
                break

        if success and not self.is_valid_end_state():
            self.add_error("Incomplete command. Please specify what to draw.")
            success = False

        if success:
            self.currentState = FSM_STATES["END"]
            self.finalize_parsed_command()
        else:
            self.currentState = FSM_STATES["ERROR"]

        return self.get_result()

    def tokenize_command(self, command_string: str) -> List[str]:
        """Tokenize command string, handling compound words and ensuring proper word boundaries."""
        if not command_string:
            return []
            
        command = command_string.lower().strip()
        original_command = command
        compound_replacements = {}
        
        # First, try to match compound words with word boundaries
        def find_compounds(compounds: dict, single: str) -> None:
            for compound, replacement in compounds.items():
                # Use word boundary check to prevent partial matches
                parts = compound.split()
                if len(parts) > 1:  # Only process actual compounds
                    if all(f" {part} " in f" {command} " for part in parts):
                        compound_replacements[compound] = (replacement, single)
                        return True
            return False
                    
        # Check for compound words in order of precedence
        command_parts = command.split()
        for i in range(len(command_parts)):
            for j in range(i + 2, len(command_parts) + 1):  # Start from 2 words
                potential_compound = " ".join(command_parts[i:j])
                # Try to match with registered compounds
                for compounds_dict, category in [
                    (COMPOUND_COLORS, "COLOR"),
                    (COMPOUND_SIZES, "SIZE"),
                    (COMPOUND_OBJECTS, "OBJECT"),
                    (COMPOUND_SHAPES, "SHAPE")
                ]:
                    if potential_compound in compounds_dict:
                        replacement = compounds_dict[potential_compound]
                        compound_replacements[potential_compound] = (replacement, category)
                        
        # Apply replacements in reverse order of length to avoid conflicts
        for compound, (replacement, _) in sorted(compound_replacements.items(), 
                                             key=lambda x: len(x[0]), reverse=True):
            command = command.replace(compound, replacement)
                    
        # Split into tokens and filter empty strings
        tokens = [t for t in command.split() if t]
        
        # Store original mapping for error handling
        self._compound_mapping = compound_replacements
        self._original_command = original_command
        
        return tokens

    def suggest_corrections(self, word: str, expected_categories: list[str] = None) -> list[str]:
        """Find possible corrections for a word based on the current state and level."""
        if not word:
            return []
            
        # Determine which categories to check based on current state
        if expected_categories is None:
            valid_transitions = STATE_TRANSITIONS.get(self.currentState, {})
            expected_categories = list(valid_transitions.keys())
        
        # Get all words from the relevant categories
        candidates = []
        for category in expected_categories:
            # Add regular vocabulary words
            cat_key = next((k for k, v in GRAMMAR_CATEGORIES.items() 
                          if v[0] == category), category + "S")
            level_vocab = get_level_vocabulary(self.level)
            candidates.extend(level_vocab.get(cat_key, []))
            
            # Add compound words
            compound_dict = None
            if category == "COLOR":
                compound_dict = COMPOUND_COLORS
            elif category == "SIZE":
                compound_dict = COMPOUND_SIZES
            elif category == "OBJECT":
                compound_dict = COMPOUND_OBJECTS
            elif category == "SHAPE":
                compound_dict = COMPOUND_SHAPES
                
            if compound_dict:
                # Add both compound phrases and their single-token equivalents
                candidates.extend(compound_dict.keys())  # Add compound phrases
                candidates.extend(compound_dict.values())  # Add single-token equivalents
        
        # Check if input might be a partial compound word
        compound_suggestions = []
        if len(word.split()) > 1:
            # Try to match partial compounds
            test_word = word.lower()
            for category in expected_categories:
                compound_dict = None
                if category == "COLOR":
                    compound_dict = COMPOUND_COLORS
                elif category == "SIZE":
                    compound_dict = COMPOUND_SIZES
                elif category == "OBJECT":
                    compound_dict = COMPOUND_OBJECTS
                elif category == "SHAPE":
                    compound_dict = COMPOUND_SHAPES
                    
                if compound_dict:
                    for compound in compound_dict.keys():
                        if (test_word in compound or compound in test_word or
                            any(w in compound for w in test_word.split())):
                            compound_suggestions.append(compound)
        
        # Find close matches for single tokens and compounds
        matches = []
        # For single-word inputs, prioritize single tokens
        if len(word.split()) == 1:
            single_matches = find_closest_matches(word, [c for c in candidates if " " not in c])
            matches.extend((m[0], m[1]) for m in single_matches)
        
        # Add exact compound matches first
        matches.extend((s, 0) for s in compound_suggestions)
        
        # Add close compound matches
        if len(word.split()) > 1:
            compound_matches = find_closest_matches(word, [c for c in candidates if " " in c])
            matches.extend((m[0], m[1]) for m in compound_matches)
        
        # Sort by edit distance and remove duplicates
        matches.sort(key=lambda x: x[1])
        seen = set()
        unique_matches = []
        for m, _ in matches:
            if m not in seen:
                unique_matches.append(m)
                seen.add(m)
                
        return unique_matches

    def handle_invalid_transition(self, word: str, category: str, is_compound: bool = False, original_compound: str = None) -> None:
        cs = self.currentState
        display_word = original_compound if is_compound else word
        
        if cs == FSM_STATES["START"]:
            if category == "UNKNOWN":
                self.add_error(f'"{display_word}" is not a recognized word')
                if is_compound:
                    suggestions = self.suggest_corrections(" ".join(display_word.split()), ["COMMAND"])
                else:
                    suggestions = self.suggest_corrections(word, ["COMMAND"])
                if suggestions:
                    suggestion_text = []
                    for s in suggestions:
                        if " " in s:  # It's a compound suggestion
                            suggestion_text.append(f'"{s}"')
                        else:
                            suggestion_text.append(s)
                    self.add_suggestion(f'Did you mean: {", ".join(suggestion_text)}?')
            else:
                self.add_error('Commands must start with a verb like "draw" or "make"')
                self.add_suggestion(f'Try: "draw {display_word}"')
            return
            
        if cs == FSM_STATES["COMMAND"]:
            if category == "COMMAND":
                self.add_error("Don't repeat the command word")
            elif category == "UNKNOWN":
                if is_compound:
                    # Check if any part of the compound is valid
                    parts = display_word.split()
                    valid_parts = [p for p in parts if categorize_word(p) != "UNKNOWN"]
                    if valid_parts:
                        self.add_error(f'"{display_word}" is not a valid combination. Did you mean to use these words separately?')
                    else:
                        self.add_error(f'"{display_word}" is not a recognized phrase')
                else:
                    self.add_error(f'"{display_word}" is not a recognized word')
                    
                # Get suggestions considering both regular and compound words
                if is_compound:
                    suggestions = self.suggest_corrections(display_word)
                else:
                    suggestions = self.suggest_corrections(word)
                if suggestions:
                    suggestion_text = []
                    for s in suggestions:
                        if " " in s:  # It's a compound suggestion
                            suggestion_text.append(f'"{s}"')
                        else:
                            suggestion_text.append(s)
                    self.add_suggestion(f'Did you mean: {", ".join(suggestion_text)}?')
            else:
                self.add_error("Expected article, size, color, or shape after the command")
            return
        if cs == FSM_STATES["ARTICLE"]:
            if category == "ARTICLE":
                self.add_error("Don't use multiple articles (a, an, the)")
            elif category == "COMMAND":
                self.add_error("Already specified the command")
            else:
                self.add_error(f'Expected size, color, or shape after "{self.get_last_word()}"')
            return
        if cs in (FSM_STATES["SIZE"], FSM_STATES["COLOR"]):
            if category == "SIZE" and cs == FSM_STATES["SIZE"]:
                self.add_error("Don't use multiple size words")
            elif category == "COLOR" and cs == FSM_STATES["COLOR"]:
                self.add_error("Don't use multiple color words")
            else:
                self.add_error("Expected a shape or object to draw")
            return
        if cs in (FSM_STATES["SHAPE"], FSM_STATES["OBJECT"]):
            self.add_error("Command is already complete. Start a new command.")
            return
        self.add_error(f'Unexpected word: "{word}"')

    def check_common_mistakes(self, command_string: str) -> str:
        lower = command_string.lower().strip()
        if lower in COMMON_MISTAKES:
            return COMMON_MISTAKES[lower]
        corrected = lower
        import re
        article_pattern = re.compile(r"^(draw|make|create)\s+(circle|square|triangle|rectangle|house|tree|star)$")
        m = article_pattern.match(corrected)
        if m:
            verb, noun = m.group(1), m.group(2)
            article = get_correct_article(noun)
            corrected = f"{verb} {article} {noun}"
        return corrected

    def is_valid_end_state(self) -> bool:
        return self.currentState in (FSM_STATES["SHAPE"], FSM_STATES["OBJECT"]) 

    def update_parsed_command(self, word: str, category: str) -> None:
        # Preserve compound words in their original form
        original_word = word
        for compound, (replacement, _) in self.compound_mapping.items():
            if replacement.lower() == word.lower():
                original_word = compound
                break

        if category == "COMMAND":
            self.parsedCommand["action"] = word
        elif category == "ARTICLE":
            self.parsedCommand["article"] = word
        elif category == "SIZE":
            self.parsedCommand["size"] = word
        elif category == "COLOR":
            self.parsedCommand["color"] = original_word
        elif category == "SHAPE":
            self.parsedCommand["type"] = word
            self.parsedCommand["category"] = "shape"
        elif category == "OBJECT":
            self.parsedCommand["type"] = word
            self.parsedCommand["category"] = "object"

    def finalize_parsed_command(self) -> None:
        if "color" not in self.parsedCommand:
            self.parsedCommand["color"] = "#333333"
        else:
            self.parsedCommand["color"] = self.get_color_hex(self.parsedCommand["color"])
        if "size" not in self.parsedCommand:
            self.parsedCommand["size"] = "medium"
        if "action" not in self.parsedCommand:
            self.parsedCommand["action"] = "draw"
        vocab = get_level_vocabulary(self.level)
        t = self.parsedCommand.get("type")
        valid_shapes = vocab.get("SHAPES", [])
        valid_objects = vocab.get("OBJECTS", [])
        if t and t not in valid_shapes and t not in valid_objects:
            self.add_error(f'"{t}" is not a valid shape or object for level {self.level}')
            self.currentState = FSM_STATES["ERROR"]
            return
        import time
        self.parsedCommand["id"] = int(time.time() * 1000)
        from datetime import datetime
        self.parsedCommand["timestamp"] = datetime.utcnow().isoformat()

    def get_color_hex(self, color_name: str) -> str:
        color_map = {
            "red": "#FF0000", "blue": "#0000FF", "green": "#008000", "yellow": "#FFFF00",
            "orange": "#FFA500", "purple": "#800080", "pink": "#FFC0CB", "black": "#000000",
            "white": "#FFFFFF", "gray": "#808080", "grey": "#808080", "brown": "#A52A2A",
            "cyan": "#00FFFF", "magenta": "#FF00FF", "lime": "#00FF00", "navy": "#000080",
            "maroon": "#800000", "olive": "#808000", "teal": "#008080", "silver": "#C0C0C0",
            "gold": "#FFD700",
            # Compound colors
            "light green": "#90EE90", "dark green": "#006400",
            "light blue": "#ADD8E6", "dark blue": "#00008B",
            "light red": "#FFB6C6", "dark red": "#8B0000",
            "light yellow": "#FFFFE0", "dark yellow": "#DAA520",
            "sky blue": "#87CEEB", "navy blue": "#000080",
            "forest green": "#228B22", "sea green": "#2E8B57",
            "hot pink": "#FF69B4", "deep purple": "#483D8B",
            "light purple": "#DDA0DD"
        }
        return color_map.get(color_name.lower(), "#333333")

    def add_error(self, message: str) -> None:
        self.errors.append(message)

    def add_suggestion(self, message: str) -> None:
        self.suggestions.append(message)

    def get_last_word(self) -> str:
        return self.processedTokens[-1]["word"] if self.processedTokens else ""

    def get_result(self) -> FSMResult:
        is_valid = self.currentState == FSM_STATES["END"]
        can_draw = is_valid and bool(self.parsedCommand)
        return FSMResult(
            isValid=is_valid,
            currentState=self.currentState,
            errors=list(self.errors),
            suggestions=list(self.suggestions),
            processedTokens=list(self.processedTokens),
            parsedCommand=dict(self.parsedCommand),
            canDraw=can_draw,
        )

def create_fsm(level: int = 1) -> FSMEngine:
    return FSMEngine(level)

def validate_command(command_string: str, level: int = 1) -> FSMResult:
    fsm = create_fsm(level)
    return fsm.process_command(command_string)
