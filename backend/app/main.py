from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict
from .fsm import validate_command
from .grammar import get_level_vocabulary
from .rule_engine import analyze_command

app = FastAPI(title="FLA Python Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ParseRequest(BaseModel):
    text: str
    level: int = 1


class AnalyzeRequest(BaseModel):
    text: str
    level: int = 1


@app.post("/parse")
def parse(req: ParseRequest) -> Dict[str, Any]:
    res = validate_command(req.text, req.level)
    # Pydantic/JSON friendly
    return {
        "isValid": res.isValid,
        "currentState": res.currentState,
        "errors": res.errors,
        "suggestions": res.suggestions,
        "processedTokens": res.processedTokens,
        "parsedCommand": res.parsedCommand,
        "canDraw": res.canDraw,
    }


@app.post("/analyze")
def analyze(req: AnalyzeRequest) -> Dict[str, Any]:
    fsm_res = validate_command(req.text, req.level)
    feedback = analyze_command(req.text, req.level, {
        "isValid": fsm_res.isValid,
        "canDraw": fsm_res.canDraw,
        "parsedCommand": fsm_res.parsedCommand,
        "errors": fsm_res.errors,
        "suggestions": fsm_res.suggestions,
    })
    return feedback


@app.get("/")
def root():
    return {"status": "ok", "service": "FLA Python Backend"}


@app.get("/vocab")
def vocab(level: int = 1):
    return get_level_vocabulary(level)
