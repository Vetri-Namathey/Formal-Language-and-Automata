
# Grammar Drawing App (FLA)

This project is an educational drawing game that parses simple English commands and draws shapes on a canvas. It's built with React and uses a small FSM (finite state machine) to validate commands and Firebase Firestore to persist user progress.

## Recent additions

- Level progression (unlock vocabulary by level)
- Scoreboard, streaks, and badges
- Command history (last 10 commands persisted per user)
- Rule engine that analyzes commands and provides context-aware hints and suggestions
- Unified `FeedbackBox` UI to surface analyzer output

## Important files

- `src/fsm/fsmEngine.js` — FSM implementation that tokenizes and validates commands. Returns `parsedCommand`, `errors`, `suggestions`, and `canDraw`.
- `src/fsm/grammar.js` — Vocabulary lists and `LEVEL_VOCABULARY`, `COMMON_MISTAKES` data.
- `src/fsm/ruleEngine.js` — New: enriches FSM results with contextual hints (common mistake corrections, level hints, similar-word suggestions, next-step tips).
- `src/components/FeedbackBox.jsx` — New: feedback UI component used across the game.
- `src/pages/Game.jsx` — The main game page; integrates FSM, rule engine, scoring, level tracker, scoreboard, badges, and command history.

## Quick local test flow

1. Start the dev server:
```powershell
cd "D:\Academics (D)\SEM-5\Projects\Formal_Language_Automata\FLA"
npm start
```

2. Open http://localhost:3000 in your browser.

3. Test scenarios:
	- Valid command: `draw a red circle` — should draw the shape and show success feedback.
	- Missing article: `draw circle` — should appear as a common-mistake and suggest `draw a circle`.
	- Higher-level token: while on level 1, try `triangle` (introduced at later levels) — feedback should tell which level unlocks it.
	- Malformed commands: expect FSM error messages and rule-engine suggestions.
	- Check Command History: the right panel shows last 10 commands with accepted/rejected and parsed results.
	- Level progression: after 5 successful commands (default), LevelTracker should allow leveling up and unlocking new vocab.

## FSM parsing status

- The FSM is implemented in `src/fsm/fsmEngine.js` and is actively used by the app. It categorizes tokens via `categorizeWord` and enforces transitions defined in `STATE_TRANSITIONS`.
- The rule engine (`src/fsm/ruleEngine.js`) is layered on top of the FSM to provide user-friendly hints.
- Current status: FSM parsing is implemented and wired into the app. The rule engine provides additional guidance. If you see commands being wrongly rejected, check that `src/fsm/grammar.js` vocabulary matches expected tokens (singular token names are mapped via CATEGORY_NAME_MAP).

## Notes & next steps

- I recommend adding unit tests for `validateCommand` and `analyzeCommand` to lock behavior down.
- Optional: add fuzzy spelling correction for better typo handling.

If you'd like, I can add tests or fuzzy matching next.
