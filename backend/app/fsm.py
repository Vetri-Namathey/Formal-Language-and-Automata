from dataclasses import dataclass, field
from typing import List, Dict, Any
from .grammar import (
    categorize_word,
    get_level_vocabulary,
    is_word_valid_for_level,
    get_correct_article,
    COMMON_MISTAKES,
)

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
        self.reset()

    def reset(self) -> None:
        self.currentState = FSM_STATES["START"]
        self.processedTokens: List[Dict[str, str]] = []
        self.errors: List[str] = []
        self.suggestions: List[str] = []
        self.parsedCommand: Dict[str, Any] = {}

    def set_level(self, level: int) -> None:
        self.level = level

    def process_token(self, token: str) -> bool:
        word = token.lower().strip()
        category = categorize_word(word)

        if not is_word_valid_for_level(word, self.level) and category != "UNKNOWN":
            self.add_error(f'"{word}" is not available in level {self.level}')
            return False

        valid_transitions = STATE_TRANSITIONS.get(self.currentState, {})
        if category not in valid_transitions:
            self.handle_invalid_transition(word, category)
            return False

        self.currentState = valid_transitions[category]
        self.processedTokens.append({"word": word, "category": category})
        self.update_parsed_command(word, category)
        return True

    def process_command(self, command_string: str) -> FSMResult:
        self.reset()
        tokens = self.tokenize_command(command_string)
        if len(tokens) == 0:
            self.add_error("Please enter a command")
            return self.get_result()

        corrected = self.check_common_mistakes(command_string)
        if corrected != command_string:
            self.add_suggestion(f'Did you mean: "{corrected}"?')

        success = True
        for tok in tokens:
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
        return [t for t in command_string.lower().strip().split() if t]

    def handle_invalid_transition(self, word: str, category: str) -> None:
        cs = self.currentState
        if cs == FSM_STATES["START"]:
            if category == "UNKNOWN":
                self.add_error(f'"{word}" is not a recognized word')
            else:
                self.add_error('Commands must start with a verb like "draw" or "make"')
                self.add_suggestion(f'Try: "draw {word}"')
            return
        if cs == FSM_STATES["COMMAND"]:
            if category == "COMMAND":
                self.add_error("Don't repeat the command word")
            elif category == "UNKNOWN":
                self.add_error(f'"{word}" is not a recognized word')
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
        if category == "COMMAND":
            self.parsedCommand["action"] = word
        elif category == "ARTICLE":
            self.parsedCommand["article"] = word
        elif category == "SIZE":
            self.parsedCommand["size"] = word
        elif category == "COLOR":
            self.parsedCommand["color"] = word
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
