# Quick Start: Translation Feature

## For Users

### How to Translate Your Notes

1. **Open a Note**
   - Go to "My Notes" page
   - Click on any note to open it in the viewer

2. **Select Language**
   - Look for the language dropdown with 🌐 icon
   - Choose your desired language (Spanish, French, Hindi, etc.)

3. **Translate Entire Note**
   - Click the "Translate All" button
   - Wait 2-3 seconds for translation to complete
   - Your note will be displayed in the selected language

4. **Translate Individual Sections**
   - Select a language from dropdown
   - Click "Translate" button on any section
   - Only that section will be translated

5. **Export Translated Notes**
   - After translation, use the export buttons (PDF/MD)
   - Your translated content will be included

### Supported Languages

**Popular Languages:**
- Spanish 🇪🇸
- French 🇫🇷
- German 🇩🇪
- Hindi 🇮🇳
- Chinese 🇨🇳
- Japanese 🇯🇵
- Korean 🇰🇷
- Arabic 🇸🇦
- Portuguese 🇵🇹
- Russian 🇷🇺
- Italian 🇮🇹

**45+ total languages supported!**

## For Developers

### Quick Integration

#### 1. Translate a Note
```javascript
// In your React component
const translateNote = async (noteId, targetLanguage) => {
  const response = await fetch(`/api/notes/${noteId}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ targetLang: targetLanguage })
  });
  
  const data = await response.json();
  return data;
};

// Usage
const result = await translateNote('note123', 'es');
console.log(result.data.translatedNotes);
```

#### 2. Translate Text
```javascript
const translateText = async (text, targetLang) => {
  const response = await fetch('/api/notes/translate-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ text, targetLang, sourceLang: 'auto' })
  });
  
  return await response.json();
};

// Usage
const result = await translateText('Hello World', 'fr');
console.log(result.data.translatedText); // "Bonjour le monde"
```

#### 3. Get Supported Languages
```javascript
const getLanguages = async () => {
  const response = await fetch('/api/notes/languages', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data.data; // Array of {code, name}
};
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/notes/:id/translate` | POST | Translate entire note |
| `/api/notes/translate-text` | POST | Translate text snippet |
| `/api/notes/languages` | GET | Get supported languages |

### Language Codes

| Code | Language | Code | Language |
|------|----------|------|----------|
| `en` | English | `es` | Spanish |
| `fr` | French | `de` | German |
| `hi` | Hindi | `zh-CN` | Chinese |
| `ja` | Japanese | `ko` | Korean |
| `ar` | Arabic | `pt` | Portuguese |
| `ru` | Russian | `it` | Italian |

[See full list in TRANSLATION_API.md]

### Error Handling

```javascript
try {
  const result = await translateNote(noteId, 'es');
  if (result.success) {
    // Update UI with translated content
    setTranslatedNotes(result.data.translatedNotes);
  } else {
    // Show error message
    alert(result.message);
  }
} catch (error) {
  console.error('Translation failed:', error);
  // Fallback to original content
}
```

## Testing

### Manual Test Steps

1. **Generate a Note**
   ```
   - Go to "Generate Notes"
   - Paste YouTube URL
   - Generate notes
   ```

2. **Open Note Viewer**
   ```
   - Go to "My Notes"
   - Click on generated note
   ```

3. **Test Translation**
   ```
   - Select Spanish from dropdown
   - Click "Translate All"
   - Verify content appears in Spanish
   ```

4. **Test Section Translation**
   ```
   - Select French
   - Click translate on one section
   - Verify only that section translates
   ```

### Automated Testing

```javascript
// Test translation endpoint
describe('Translation API', () => {
  it('should translate note to Spanish', async () => {
    const response = await request(app)
      .post('/api/notes/note123/translate')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetLang: 'es' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.targetLang).toBe('es');
  });
  
  it('should translate text', async () => {
    const response = await request(app)
      .post('/api/notes/translate-text')
      .set('Authorization', `Bearer ${token}`)
      .send({ 
        text: 'Hello', 
        targetLang: 'fr' 
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.translatedText).toBeTruthy();
  });
});
```

## Troubleshooting

### Issue: Translation not working
**Solution:** Check authentication token is valid

### Issue: Slow translation
**Solution:** Normal for large notes (2-5 seconds)

### Issue: Translation looks wrong
**Solution:** Google Translate quality varies by language pair

### Issue: "Translation failed" error
**Solution:** Check internet connection and backend server status

## Best Practices

✅ **DO:**
- Select appropriate target language
- Wait for translation to complete before navigating away
- Save translated notes if needed
- Use section translation for quick checks

❌ **DON'T:**
- Translate the same content repeatedly (cache results)
- Expect perfect translations (machine translation has limitations)
- Use for critical/legal documents without review

## Support

For issues or questions:
- Check `TRANSLATION_API.md` for detailed API docs
- Check `TRANSLATION_IMPLEMENTATION.md` for technical details
- Review browser console for error messages
- Contact development team

---

**Version:** 1.0.0
**Last Updated:** November 2025
**Package:** google-translate-api v2.3.0
