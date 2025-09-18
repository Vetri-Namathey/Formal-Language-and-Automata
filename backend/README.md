# Python Backend (FastAPI)

This backend provides Python implementations of the grammar, FSM, and rule engine to parse drawing commands.

Endpoints:
- POST /parse: { text: string, level: number } -> parsing result
- POST /analyze: { text: string, level: number } -> feedback message and suggestions

Local run (Windows PowerShell):

```powershell
# Create venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install deps
pip install -r requirements.txt

# Run
uvicorn app.main:app --reload --port 8000
```

Frontend calls http://localhost:8000 by default. Override with `REACT_APP_BACKEND_URL`.

Frontend wiring:
- New file `src/services/backendApi.js` calls the FastAPI endpoints.
- `Game.jsx` now uses the backend for parsing/analyzing instead of JS FSM.
- You can override the URL with env var: create `.env.local` in the project root:

```env
REACT_APP_BACKEND_URL=http://127.0.0.1:8000
```
