
# Grammar Drawing App (FLA)

This project is an educational drawing game that parses simple English commands and draws shapes on a canvas. The parsing is implemented in a Python FastAPI backend (FSM + grammar + rule engine), while the frontend is React. Firebase Firestore is used to persist user progress.

## Recent additions

- Level progression (unlock vocabulary by level)
- Scoreboard, streaks, and badges
- Command history (last 10 commands persisted per user)
- Rule engine that analyzes commands and provides context-aware hints and suggestions
- Unified `FeedbackBox` UI to surface analyzer output

## Important files

Backend (Python):
- `backend/app/grammar.py` — Vocabulary lists and `LEVEL_VOCABULARY`, `COMMON_MISTAKES`, and helpers.
- `backend/app/fsm.py` — FSM implementation that tokenizes and validates commands. Returns `parsedCommand`, `errors`, `suggestions`, and `canDraw`.
- `backend/app/rule_engine.py` — Analyzer: contextual hints (common mistake corrections, level hints, similar-word suggestions, next-step tips).
- `backend/app/main.py` — FastAPI entrypoint. Endpoints: `POST /parse`, `POST /analyze`, `GET /vocab`.
- `backend/requirements.txt` — Backend dependencies.

Frontend (React):
- Note: The old `src/fsm/` JS modules are deprecated and no longer used by the app.
- `src/services/backendApi.js` — Client to call FastAPI endpoints.
- `src/pages/Game.jsx` — Main page; calls backend for parsing/analyzing; handles scoring, level tracker, scoreboard, badges, history.
- `src/components/FeedbackBox.jsx` — Feedback UI component.

## Quick local test flow

1. Start the backend (FastAPI):
```powershell
cd backend
python -m venv .venv
..\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

2. Start the frontend:
```powershell
npm start
```

3. Open http://localhost:3000 in your browser.

3. Test scenarios:
	- Valid command: `draw a red circle` — should draw the shape and show success feedback.
	- Missing article: `draw circle` — should appear as a common-mistake and suggest `draw a circle`.
	- Higher-level token: while on level 1, try `triangle` (introduced at later levels) — feedback should tell which level unlocks it.
	- Malformed commands: expect FSM error messages and rule-engine suggestions.
	- Check Command History: the right panel shows last 10 commands with accepted/rejected and parsed results.
	- Level progression: after 5 successful commands (default), LevelTracker should allow leveling up and unlocking new vocab.

## Parsing architecture (Python)

- The FSM and rule engine run in the backend. `Game.jsx` sends the raw command and current level to FastAPI.
- `grammar.get_level_vocabulary` is strict per-level (no merge with global), preventing out-of-level words.
- `rule_engine` uses Levenshtein-based suggestions and level gating hints.

## Notes & next steps

- I recommend adding unit tests for Python `validate_command` and `analyze_command` to lock behavior down.
- Optional: add a UI health indicator (already included) to surface backend availability.

If you'd like, I can add tests or fuzzy matching next.
