# Translation API Documentation

## Overview
The StenoMind backend now includes translation functionality using the `google-translate-api` package. This allows users to translate their generated notes into multiple languages.

## Features
- ✅ Translate entire notes (structured content)
- ✅ Translate individual text sections
- ✅ Auto-detect source language
- ✅ Support for 45+ languages
- ✅ Preserve note structure during translation

## API Endpoints

### 1. Translate Entire Note
Translates all content of a note including summary, key points, and sections.

**Endpoint:** `POST /api/notes/:id/translate`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "targetLang": "es"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Note translated successfully",
  "data": {
    "translatedNotes": {
      "summary": "...",
      "keyPoints": [...],
      "sections": [...]
    },
    "translatedFullContent": "...",
    "targetLang": "es",
    "originalNote": {
      "_id": "...",
      "title": "..."
    }
  }
}
```

### 2. Translate Text
Translates arbitrary text content.

**Endpoint:** `POST /api/notes/translate-text`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "text": "Hello, how are you?",
  "targetLang": "es",
  "sourceLang": "auto"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "translatedText": "Hola, ¿cómo estás?",
    "sourceLang": "en",
    "targetLang": "es",
    "detectedLang": "en",
    "autoCorrected": false,
    "didYouMean": false,
    "fallback": false
  }
}
```

### 3. Get Supported Languages
Returns list of all supported languages.

**Endpoint:** `GET /api/notes/languages`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "code": "en", "name": "English" },
    { "code": "es", "name": "Spanish" },
    { "code": "fr", "name": "French" },
    ...
  ]
}
```

## Supported Languages

| Language | Code | Language | Code |
|----------|------|----------|------|
| English | `en` | Spanish | `es` |
| French | `fr` | German | `de` |
| Hindi | `hi` | Chinese (Simplified) | `zh-CN` |
| Chinese (Traditional) | `zh-TW` | Japanese | `ja` |
| Korean | `ko` | Arabic | `ar` |
| Portuguese | `pt` | Russian | `ru` |
| Italian | `it` | Dutch | `nl` |
| Polish | `pl` | Turkish | `tr` |
| Vietnamese | `vi` | Thai | `th` |
| Indonesian | `id` | Malay | `ms` |
| Bengali | `bn` | Tamil | `ta` |
| Telugu | `te` | Marathi | `mr` |
| Gujarati | `gu` | Kannada | `kn` |
| Malayalam | `ml` | Punjabi | `pa` |
| Urdu | `ur` | Persian | `fa` |
| Hebrew | `he` | Swedish | `sv` |
| Norwegian | `no` | Danish | `da` |
| Finnish | `fi` | Greek | `el` |
| Czech | `cs` | Romanian | `ro` |
| Hungarian | `hu` | Ukrainian | `uk` |
| Bulgarian | `bg` | Serbian | `sr` |
| Croatian | `hr` | Slovak | `sk` |
| Slovenian | `sl` | | |

## Usage Examples

### Frontend Usage (React)

#### Translate Entire Note
```javascript
const translateNote = async (noteId, targetLang) => {
  try {
    const response = await fetch(`/api/notes/${noteId}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ targetLang })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update UI with translated content
      console.log('Translated:', data.data.translatedNotes);
    }
  } catch (error) {
    console.error('Translation failed:', error);
  }
};

// Usage
translateNote('note-id-123', 'es'); // Translate to Spanish
```

#### Translate Section Text
```javascript
const translateSection = async (text, targetLang) => {
  try {
    const response = await fetch('/api/notes/translate-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        text, 
        targetLang,
        sourceLang: 'auto' 
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data.translatedText;
    }
  } catch (error) {
    console.error('Translation failed:', error);
    return text; // Return original text on error
  }
};

// Usage
const translatedText = await translateSection(
  'This is a section of my notes', 
  'fr'
);
```

## Translation Service Methods

### `translateText(text, targetLang, sourceLang = 'auto')`
Translates a single piece of text.

**Parameters:**
- `text` (string): Text to translate
- `targetLang` (string): Target language code
- `sourceLang` (string, optional): Source language code (defaults to 'auto' for auto-detection)

**Returns:** Object with translation result

### `translateStructuredNotes(structuredNotes, targetLang)`
Translates an entire structured notes object, including summary, key points, and all sections.

**Parameters:**
- `structuredNotes` (object): Structured notes object
- `targetLang` (string): Target language code

**Returns:** Object with translated structured notes

### `detectLanguage(text)`
Detects the language of given text.

**Parameters:**
- `text` (string): Text to detect language for

**Returns:** Object with detected language info

### `getSupportedLanguages()`
Returns array of supported languages with codes and names.

**Returns:** Array of language objects

## Error Handling

All translation endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (in development mode only)"
}
```

Common error scenarios:
- **401 Unauthorized:** User not authenticated
- **400 Bad Request:** Missing required parameters
- **404 Not Found:** Note not found or no permission
- **500 Internal Server Error:** Translation service failure

When translation fails, the service returns a fallback response with the original text to ensure graceful degradation.

## Frontend Integration

The NoteViewer component now includes:

1. **Language Selector** - Dropdown to choose target language
2. **Translate All Button** - Translates entire note at once
3. **Section Translation** - Individual section translation buttons
4. **Real-time Updates** - Translated content updates immediately in UI

### Features:
- ✅ Preserves note structure
- ✅ Shows translation status
- ✅ Handles errors gracefully
- ✅ Supports 45+ languages
- ✅ Auto-detects source language

## Performance Considerations

- Translation requests are made asynchronously
- Large notes may take a few seconds to translate completely
- Section-by-section translation provides faster feedback
- Translated content can be cached on the frontend to avoid repeated API calls

## Limitations

- Requires active internet connection
- Rate limits may apply based on the translation service
- Very long texts may need to be split into chunks
- Technical terms may not always translate accurately
- Some languages may have better translation quality than others

## Future Enhancements

- [ ] Cache translated content in database
- [ ] Batch translation for multiple notes
- [ ] Custom translation memory for domain-specific terms
- [ ] Translation quality scoring
- [ ] Side-by-side original/translated view
