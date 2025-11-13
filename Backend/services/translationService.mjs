// src/services/translationService.js
import translate from '@vitalets/google-translate-api';

/**
 * Translate text using free Google Translate API (unofficial)
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., 'es', 'fr', 'hi')
 * @param {string} sourceLang - Source language (optional)
 * @returns {object} Translation result
 */
export const translateText = async (text, targetLang, sourceLang = 'auto') => {
  try {
    const res = await translate(text, { from: sourceLang, to: targetLang });
    return {
      translatedText: res.text,
      sourceLang: res.from.language.iso,
      targetLang,
      fallback: false
    };
  } catch (error) {
    console.error('Translation error:', error.message);
    return {
      translatedText: text,
      sourceLang,
      targetLang,
      fallback: true
    };
  }
};

/**
 * Detect language of given text
 * @param {string} text - Text to detect language for
 * @returns {object} Language detection result
 */
export const detectLanguage = async (text) => {
  try {
    const res = await translate(text, { to: 'en' });
    return {
      language: res.from.language.iso,
      confidence: res.from.text.value ? 1.0 : 0.8
    };
  } catch (error) {
    console.error('Language detection error:', error.message);
    return { language: 'en', confidence: 0 };
  }
};

/**
 * Get list of supported languages
 * @returns {array} List of supported languages
 */
export const getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'it', name: 'Italian' }
  ];
};
