// Simple client for the Python backend
// Uses fetch; set BACKEND_URL env or defaults to http://localhost:8000

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export async function parseCommand(text, level = 1) {
  const res = await fetch(`${BASE_URL}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, level }),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

export async function analyzeCommandAPI(text, level = 1) {
  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, level }),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

export async function getVocab(level = 1) {
  const res = await fetch(`${BASE_URL}/vocab?level=${encodeURIComponent(level)}`);
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}
