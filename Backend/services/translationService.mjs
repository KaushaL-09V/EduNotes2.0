// src/services/translationService.mjs
import translate from '@vitalets/google-translate-api';
import { HttpProxyAgent } from 'http-proxy-agent';

// Helper to add delay between requests to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Translate text using Google Translate API
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., 'es', 'fr', 'hi')
 * @param {string} sourceLang - Source language (optional, defaults to 'auto')
 * @returns {object} Translation result
 */
export const translateText = async (text, targetLang, sourceLang = 'auto') => {
  try {
    if (!text || !targetLang) {
      throw new Error('Text and target language are required');
    }

    console.log(`Translating from ${sourceLang} to ${targetLang}...`);

    // Add small delay to avoid rate limiting
    await delay(100);

    const res = await translate(text, { from: sourceLang, to: targetLang });

    return {
      success: true,
      translatedText: res.text,
      sourceLang: res.from.language.iso,
      targetLang,
      detectedLang: res.from.language.iso,
      autoCorrected: res.from.text.autoCorrected || false,
      didYouMean: res.from.text.didYouMean || false,
      fallback: false
    };
  } catch (error) {
    console.error('Translation error:', error.message, error.code || '');
    // Return original text as fallback to prevent showing empty content
    return {
      success: false,
      translatedText: text,
      sourceLang,
      targetLang,
      error: error.message,
      fallback: true
    };
  }
};

/**
 * Translate structured notes content
 * @param {object} structuredNotes - Structured notes object
 * @param {string} targetLang - Target language code
 * @returns {object} Translated structured notes
 */
export const translateStructuredNotes = async (structuredNotes, targetLang) => {
  try {
    const translatedNotes = { ...structuredNotes };
    let successCount = 0;
    let failCount = 0;

    // Translate summary
    if (structuredNotes.summary) {
      const summaryResult = await translateText(structuredNotes.summary, targetLang);
      translatedNotes.summary = summaryResult.translatedText;
      if (summaryResult.success) successCount++;
      else failCount++;
    }

    // Translate key points sequentially to avoid rate limiting
    if (structuredNotes.keyPoints && Array.isArray(structuredNotes.keyPoints)) {
      translatedNotes.keyPoints = [];
      for (const point of structuredNotes.keyPoints) {
        const result = await translateText(point, targetLang);
        translatedNotes.keyPoints.push(result.translatedText);
        if (result.success) successCount++;
        else failCount++;
      }
    }

    // Translate sections sequentially
    if (structuredNotes.sections && Array.isArray(structuredNotes.sections)) {
      translatedNotes.sections = [];
      for (const section of structuredNotes.sections) {
        const translatedSection = { ...section };

        // Translate heading
        if (section.heading) {
          const headingResult = await translateText(section.heading, targetLang);
          translatedSection.heading = headingResult.translatedText;
          if (headingResult.success) successCount++;
          else failCount++;
        }

        // Translate content
        if (section.content) {
          const contentResult = await translateText(section.content, targetLang);
          translatedSection.content = contentResult.translatedText;
          if (contentResult.success) successCount++;
          else failCount++;
        }

        // Translate key points in section
        if (section.keyPoints && Array.isArray(section.keyPoints)) {
          translatedSection.keyPoints = [];
          for (const point of section.keyPoints) {
            const result = await translateText(point, targetLang);
            translatedSection.keyPoints.push(result.translatedText);
            if (result.success) successCount++;
            else failCount++;
          }
        }

        translatedNotes.sections.push(translatedSection);
      }
    }

    console.log(`Translation completed: ${successCount} successful, ${failCount} failed`);

    return {
      success: true,
      translatedNotes,
      targetLang,
      stats: { successCount, failCount }
    };
  } catch (error) {
    console.error('Error translating structured notes:', error.message);
    return {
      success: false,
      error: error.message,
      translatedNotes: structuredNotes
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
      success: true,
      language: res.from.language.iso,
      languageName: getLanguageName(res.from.language.iso),
      confidence: res.from.text.autoCorrected ? 1.0 : 0.8
    };
  } catch (error) {
    console.error('Language detection error:', error.message);
    return {
      success: false,
      language: 'en',
      languageName: 'English',
      confidence: 0,
      error: error.message
    };
  }
};

/**
 * Get language name from code
 * @param {string} code - Language code
 * @returns {string} Language name
 */
const getLanguageName = (code) => {
  const languages = getSupportedLanguages();
  const lang = languages.find(l => l.code === code);
  return lang ? lang.name : code;
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
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'it', name: 'Italian' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'tr', name: 'Turkish' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'th', name: 'Thai' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ms', name: 'Malay' },
    { code: 'bn', name: 'Bengali' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'mr', name: 'Marathi' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ur', name: 'Urdu' },
    { code: 'fa', name: 'Persian' },
    { code: 'he', name: 'Hebrew' },
    { code: 'sv', name: 'Swedish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'da', name: 'Danish' },
    { code: 'fi', name: 'Finnish' },
    { code: 'el', name: 'Greek' },
    { code: 'cs', name: 'Czech' },
    { code: 'ro', name: 'Romanian' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'sr', name: 'Serbian' },
    { code: 'hr', name: 'Croatian' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' }
  ];
};

export default {
  translateText,
  translateStructuredNotes,
  detectLanguage,
  getSupportedLanguages
};
