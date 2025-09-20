// src/services/translationService.js

// Environment-driven configuration
const PROVIDER = (process.env.REACT_APP_TRANSLATOR_PROVIDER || 'groq').toLowerCase();

// LLM (Groq) config
const LLM_BASE_URL = (process.env.REACT_APP_LLM_TRANSLATOR_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
const LLM_API_KEY = process.env.REACT_APP_LLM_TRANSLATOR_API_KEY || '';
const LLM_MODEL = process.env.REACT_APP_LLM_TRANSLATOR_MODEL || 'llama-3.1-8b-instant';

// LLM-based translation via Groq's OpenAI-compatible API
async function translateViaLLM(text, fromLang) {
  if (!LLM_API_KEY) return null;
  const url = `${LLM_BASE_URL}/chat/completions`;
  const system = `You are a translation engine. Translate the user input from ${fromLang} to concise English suitable as a drawing command (e.g., "draw a red circle"). Output only the English translation without quotes or extra commentary.`;
  const body = {
    model: LLM_MODEL,
    temperature: 0,
    top_p: 0,
    max_tokens: 64,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: String(text) }
    ]
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`LLM translate failed: ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return content.trim();
  } catch (err) {
    console.warn('[translation] LLM request failed:', err);
    return null;
  }
}

/**
 * Translates text from sourceLanguage to English using Groq API.
 * @param {string} text - The text to translate
 * @param {('en'|'ta'|'hi'|'ml'|string)} sourceLanguage - The source language code
 * @returns {Promise<string>} - The translated text, or original text if translation fails
 */
export async function translateToEnglish(text, sourceLanguage) {
  const original = (text ?? '').toString();
  const from = (sourceLanguage || 'en').toLowerCase();
  if (!original || from === 'en') return original;

  console.log(`[translation] Translating from ${from} via Groq`);

  const translated = await translateViaLLM(original, from);
  if (typeof translated === 'string' && translated.trim()) {
    return translated;
  }

  // If translation fails, return original
  console.warn('[translation] Translation failed, returning original text');
  return original;
}

export default { translateToEnglish };