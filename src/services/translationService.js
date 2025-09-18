// src/services/translationService.js

// Environment-driven configuration
const PROVIDER = (process.env.REACT_APP_TRANSLATOR_PROVIDER || 'mock').toLowerCase();
const PROXY_URL = process.env.REACT_APP_TRANSLATOR_PROXY_URL || '';

// Azure Translator config (only used if provider === 'azure')
const AZURE_ENDPOINT = (process.env.REACT_APP_AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com').replace(/\/$/, '');
const AZURE_KEY = process.env.REACT_APP_AZURE_TRANSLATOR_KEY || '';
const AZURE_REGION = process.env.REACT_APP_AZURE_TRANSLATOR_REGION || '';

// NOTE: Putting secrets in the browser is discouraged. Prefer using a server-side proxy
// via REACT_APP_TRANSLATOR_PROXY_URL. This client will:
// 1) Use proxy if provided
// 2) Else attempt direct Azure call if key/region present (for trusted/dev only)
// 3) Else attempt LLM-based translation if configured (Groq/OpenAI-compatible)
// 4) Else fall back to a tiny mock dictionary

// LLM (Groq/OpenAI-compatible) config
// Defaults target Groq's OpenAI-compatible endpoint if base URL is not set.
const LLM_BASE_URL = (process.env.REACT_APP_LLM_TRANSLATOR_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
const LLM_API_KEY = process.env.REACT_APP_LLM_TRANSLATOR_API_KEY || '';
const LLM_MODEL = process.env.REACT_APP_LLM_TRANSLATOR_MODEL || 'llama-3.1-8b-instant';

// Mock translation dictionary (fallback)
const mockTranslations = {
  ta: {
    'சிவப்பு வட்டத்தை வரைக': 'Draw a red circle',
    'நீல சதுரத்தை வரைக': 'Draw a blue square',
  },
  hi: {
    'एक लाल वृत्त बनाएं': 'Draw a red circle',
    'एक नीला वर्ग बनाएं': 'Draw a blue square',
  },
  ml: {
    'ഒരു ചുവന്ന വൃത്തം വരയ്ക്കുക': 'Draw a red circle',
    'ഒരു നീല ചതுரം വരയ്ക്കുക': 'Draw a blue square',
  },
  en: {}
};
// LLM-based translation via OpenAI-compatible chat/completions
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


// Try proxy first (recommended)
async function translateViaProxy(text, fromLang) {
  if (!PROXY_URL) return null;
  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, from: fromLang, to: 'en', provider: PROVIDER || 'azure' })
    });
    if (!res.ok) throw new Error(`Proxy error ${res.status}`);
    const data = await res.json();
    // Accept either { translatedText } or Translator-like array
    if (data && typeof data.translatedText === 'string') return data.translatedText;
    if (Array.isArray(data) && data[0]?.translations?.[0]?.text) {
      return data[0].translations[0].text;
    }
    if (data?.text) return data.text;
    return null;
  } catch (err) {
    console.warn('[translation] Proxy request failed:', err);
    return null;
  }
}

// Direct Azure Translator call (works only if key/region are exposed; not recommended for prod)
async function translateViaAzure(text, fromLang) {
  // 3) LLM (Groq/OpenAI-compatible) if selected
  if (PROVIDER === 'groq' || PROVIDER === 'openai' || PROVIDER === 'llm' || PROVIDER === 'auto') {
    const viaLlm = await translateViaLLM(original, from);
    if (typeof viaLlm === 'string' && viaLlm.trim()) {
      return viaLlm;
    }
  }

  if (!AZURE_KEY || !AZURE_REGION) return null;
  const url = `${AZURE_ENDPOINT}/translate?api-version=3.0&from=${encodeURIComponent(fromLang)}&to=en`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Ocp-Apim-Subscription-Region': AZURE_REGION,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ Text: text }])
    });
    if (!res.ok) throw new Error(`Azure translate failed: ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.translations?.[0]?.text) {
      return data[0].translations[0].text;
    }
    return null;
  } catch (err) {
    console.warn('[translation] Azure request failed:', err);
    return null;
  }
}

// Mock fallback
function translateViaMock(text, fromLang) {
  const dict = mockTranslations[fromLang];
  if (dict && dict[text]) return dict[text];
  return text;
}

/**
 * Translates text from sourceLanguage to English using configured provider with safe fallbacks.
 * @param {string} text
 * @param {('en'|'ta'|'hi'|'ml'|string)} sourceLanguage
 * @returns {Promise<string>}
 */
export async function translateToEnglish(text, sourceLanguage) {
  const original = (text ?? '').toString();
  const from = (sourceLanguage || 'en').toLowerCase();
  if (!original || from === 'en') return original;

  console.log(`[translation] Translating from ${from} via provider=${PROVIDER}`);

  // 1) Proxy
  const viaProxy = await translateViaProxy(original, from);
  if (typeof viaProxy === 'string' && viaProxy.trim()) {
    return viaProxy;
  }

  // 2) Direct Azure (if configured and provider allows)
  if (PROVIDER === 'azure' || PROVIDER === 'auto') {
    const viaAzure = await translateViaAzure(original, from);
    if (typeof viaAzure === 'string' && viaAzure.trim()) {
      return viaAzure;
    }
  }

  // 3) Mock fallback
  const mock = translateViaMock(original, from);
  if (mock !== original) {
    console.log('[translation] Using mock dictionary fallback');
  } else {
    console.warn('[translation] No translation available, returning original text');
  }
  return mock;
}

export default { translateToEnglish };
