# 🧠 Natural Language-Guided Sketching Through Modular Command Interpretation

An **educational, multilingual drawing platform** that transforms natural language (typed or spoken) into visual sketches.
Built with **React** (frontend) and **FastAPI** (backend), the system uses **Finite State Machines (FSM)**, **Regular Grammar-based parsing**, and a **rule engine** with Levenshtein distance to interpret and validate drawing commands like:

> “draw a red circle” → 🟠

This project was developed as part of the **Formal Language and Automata (FLA)** curriculum to demonstrate real-world applications of automata theory in human–computer interaction.

---

## 🎯 Core Concept

The system defines a **formal language of drawing commands** — each command must follow specific grammar rules validated by a **Finite State Machine** (FSM).
Commands outside this language (e.g., incorrect word order, unsupported tokens) are rejected with **rule-based feedback** and **error suggestions**.

It bridges theory and application by integrating:

* **Formal Language Theory (Regular Grammar)**
* **Finite Automata**
* **Lexical Tokenization & Normalization**
* **Edit Distance (Levenshtein Distance)**
* **Speech Recognition & Translation**

---

## 🧩 System Architecture

**Frontend (React.js)**

* 🎨 Canvas-based renderer for drawing geometric primitives
* 🎤 Speech recognition via **Web Speech API** (supports English, Tamil, Hindi, Malayalam)
* 🌐 Translation pipeline (Groq/Azure/Mock)
* ⚙️ Level progression, scoring, streaks, and achievement badges
* 💬 Feedback and command history panel
* 🔠 i18n via `react-i18next`

**Backend (FastAPI + Python)**

* `grammar.py` — Defines **regular grammar** and level-wise vocabulary
* `fsm.py` — Implements the **Finite State Machine** for command validation
* `rule_engine.py` — Applies **Levenshtein Distance** for fuzzy corrections and level hints
* `main.py` — API endpoints: `/parse`, `/analyze`, `/vocab`
* Uses strict **LEVEL_VOCABULARY** to gate learning progression

**Database (Firebase Firestore)**

* Stores user progress, scores, and history
* Configured with secure read/write rules after test-mode expiry

---

## 🧠 Key FLA Concepts Applied

| Concept                        | Role in Project                       | Example                                      |            |
| ------------------------------ | ------------------------------------- | -------------------------------------------- | ---------- |
| **Finite State Machine (FSM)** | Validates command structure           | START → COMMAND → COLOR → SHAPE → END        |            |
| **Regular Grammar (Type-3)**   | Defines valid command sequences       | `COMMAND → draw                              | make` etc. |
| **Tokenization**               | Splits text into grammar symbols      | “draw a red circle” → [draw][a][red][circle] |            |
| **Normalization**              | Standardizes input                    | “Draw a Red Circle!” → “draw a red circle”   |            |
| **Parser**                     | Converts tokens to structured objects | `{action: draw, color: red, shape: circle}`  |            |
| **Levenshtein Distance**       | Suggests corrections for typos        | “drae” → “draw” (distance = 1)               |            |
| **Language Acceptance**        | Checks if input ∈ defined language    | FSM accepts only valid strings               |            |

> **Chomsky Hierarchy Relation:**
> The project implements a **Type-3 Regular Grammar**, recognized by a **Deterministic Finite Automaton (DFA)**.
> Future extensions may evolve toward **Type-2 Context-Free Grammar** for hierarchical commands (e.g., “draw a circle inside a square”).

---

## 🔊 Voice Command Processing

The system uses the **Web Speech API** for in-browser voice recognition:

1. Captures user speech input.
2. Transcribes it into text (`recognition.onresult` event).
3. Normalizes and translates it to English.
4. Sends to FastAPI `/parse` endpoint for FSM validation.

This allows voice-driven drawing in multiple Indian languages, seamlessly integrated with the grammar engine.

---

## 🚀 Quick Setup & Local Run

### 1️⃣ Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2️⃣ Frontend (React)

```bash
npm install
npm start
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🧠 Test Scenarios

| Scenario             | Example                        | Expected Result                     |
| -------------------- | ------------------------------ | ----------------------------------- |
| Valid Command        | “draw a red circle”            | Red circle drawn                    |
| Missing Article      | “draw circle”                  | Suggestion: “draw a circle”         |
| Out-of-Level Token   | “draw a triangle” (at level 1) | Hint: “triangle” unlocks at Level 2 |
| Invalid Structure    | “red draw circle”              | FSM rejects with error feedback     |
| Multilingual Command | “சிவப்பு வட்டம் வரை” (Tamil)   | Translated and drawn correctly      |

---

## 🌍 Internationalization (i18n)

* Supports **English**, **Tamil**, **Hindi**, and **Malayalam**
* Commands translated using Groq/Azure LLM APIs (mock fallback available)
* UI text managed via `react-i18next` and locale JSON files

---

## 🧮 Parsing Pipeline

1. **Input (Typed/Spoken)**
2. **Translation (if non-English)**
3. **Normalization**
4. **Tokenization**
5. **FSM Validation (Grammar Check)**
6. **Rule Engine Feedback (Levenshtein suggestions)**
7. **ParsedCommand → Canvas Draw**

---

## 🧱 File Overview

### Backend

* `grammar.py` — Grammar rules, level vocabulary, mistakes
* `fsm.py` — FSM logic, validation, parsing
* `rule_engine.py` — Hints, fuzzy matching (edit distance)
* `main.py` — FastAPI endpoints
* `requirements.txt` — Python dependencies

### Frontend

* `Game.jsx` — Core gameplay logic (scoring, feedback, levels)
* `CanvasArea.jsx` — Shape rendering and animation
* `FeedbackBox.jsx` — Suggestion and validation output
* `backendApi.js` — Handles API calls to FastAPI
* `i18n.js` — Language configuration

---

## 🧰 Technologies Used

| Layer          | Technology                                        |
| -------------- | ------------------------------------------------- |
| Frontend       | React, TailwindCSS, react-i18next, Web Speech API |
| Backend        | Python, FastAPI                                   |
| Database       | Firebase Firestore                                |
| Language Tools | Groq/Azure Translation APIs                       |
| FLA Core       | FSM, Regular Grammar, Levenshtein Distance        |

---

## 🧩 Future Enhancements

* Add **Context-Free Grammar (CFG)** support for hierarchical commands
* Introduce **Pushdown Automaton** for spatial relation parsing (“inside”, “above”)
* Real user authentication in Firebase
* Expand translation coverage with on-device caching
* Voice feedback synthesis (Text-to-Speech)
* Offline mode for classrooms

---

## 📘 Academic Note

This project was built for the **Formal Language and Automata (22AIE302)** course to demonstrate how classical computational models (FSM, grammar, edit distance) can be applied to modern AI/UX systems.
It blends **automata theory** with **natural language interaction**, showing how deterministic models can enable intelligent, interpretable command processing.

---

## 💬 Acknowledgements

Developed by
**Venkatram KS, Sanggit Saaran K C S, Vishal Seshadri B, Surya H A**
under the guidance of **Dr. Chitra P**,
*Amrita School of Artificial Intelligence, Coimbatore.*

---

## 🧾 License

This project is licensed under the [MIT License](LICENSE).

---
