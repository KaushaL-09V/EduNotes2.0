import { fetchTranscript } from "youtube-transcript-plus";

function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function isValidYouTubeUrl(url) {
  return !!extractVideoId(url);
}

const DEFAULT_LANG_PRIORITY = [
  "en",
  "hi",
  "es",
  "fr",
  "pt",
  "de",
  "ru",
  "ja",
  "zh-Hans",
  "zh",
  "ar",
  "it",
  "ko",
  "nl",
  "tr",
  "vi",
  "pl",
  "id",
];

async function tryFetchSingle(videoIdOrUrl, lang) {
  if (!lang) {
    return await fetchTranscript(videoIdOrUrl);
  }
  return await fetchTranscript(videoIdOrUrl, { lang });
}

const fetchT = async (videoUrl, lang = "auto") => {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) throw new Error("Invalid YouTube URL");

  let attemptLangs = [];

  if (!lang || lang === "auto") {
    attemptLangs = [null, ...DEFAULT_LANG_PRIORITY];
  } else if (Array.isArray(lang)) {
    attemptLangs = [...lang];
  } else if (typeof lang === "string") {
    attemptLangs = [lang, null, ...DEFAULT_LANG_PRIORITY.filter((l) => l !== lang)];
  } else {
    throw new Error("`lang` must be a string, an array of strings, or 'auto'");
  }

  let lastErr = null;

  for (const code of attemptLangs) {
    try {
      const transcriptData = await tryFetchSingle(videoUrl, code);

      if (!transcriptData || transcriptData.length === 0) {
        throw new Error("empty transcript");
      }

      const transcript = transcriptData
        .map((item) => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      const languageUsed = code || (transcriptData[0] && transcriptData[0].language) || "unknown";

      return {
        videoId,
        url: videoUrl,
        transcript,
        transcriptSegments: transcriptData.length,
        languageUsed,
      };
    } catch (err) {
      lastErr = err;
      console.warn(`Transcript fetch failed for lang='${code}': ${err.message || err}`);
    }
  }

  const message = lastErr ? lastErr.message || String(lastErr) : "No transcript available";
  throw new Error(`Failed to fetch transcript for any tested language: ${message}`);
};

export default {
  fetchT,
  extractVideoId,
  isValidYouTubeUrl,
};