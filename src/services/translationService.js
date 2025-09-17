// src/services/translationService.js

// Mock translation dictionary
const translations = {
  'ta': { // Tamil
    'சிவப்பு வட்டத்தை வரைக': 'Draw a red circle',
    'நீல சதுரத்தை வரைக': 'Draw a blue square',
  },
  'hi': { // Hindi
    'एक लाल वृत्त बनाएं': 'Draw a red circle',
    'एक नीला वर्ग बनाएं': 'Draw a blue square',
  },
  'ml': { // Malayalam
    'ഒരു ചുവന്ന വൃത്തം വരയ്ക്കുക': 'Draw a red circle',
    'ഒരു നീല ചതുരം വരയ്ക്കുക': 'Draw a blue square',
  },
  'en': {} // English needs no translation
};

/**
 * Translates text from a source language to English.
 * This is a mock implementation. Replace with a real translation API.
 * @param {string} text The text to translate.
 * @param {string} sourceLanguage The source language code (e.g., 'ta', 'hi', 'ml').
 * @returns {Promise<string>} A promise that resolves to the translated English text.
 */
const translateToEnglish = async (text, sourceLanguage) => {
  console.log(`Translating "${text}" from ${sourceLanguage} to English.`);
  
  if (sourceLanguage === 'en') {
    return text;
  }

  const dictionary = translations[sourceLanguage];
  if (dictionary && dictionary[text]) {
    const translatedText = dictionary[text];
    console.log(`Translation found: "${translatedText}"`);
    return translatedText;
  }

  // If no translation is found, return the original text.
  // In a real application, you would call a translation API here.
  console.warn(`No translation found for "${text}" in ${sourceLanguage}. Returning original text.`);
  return text;
};

export { translateToEnglish };
