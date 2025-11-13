// NoteViewer.jsx
import { useEffect, useState } from "react";
import { Download, Palette, Languages, ArrowLeft } from "lucide-react";

/**
 * NoteViewer (inline replacement)
 * - Editable title (persisted on blur)
 * - Shows video thumbnail + link if note.video / note.thumbnail available
 * - Persistent highlights via lightweight inline markers (* _ ` ~ ^)
 * - Remove highlight (removes marker from content and saves)
 * - PDF export using jsPDF loaded from CDN (generates proper PDF)
 *
 * Marker -> color mapping:
 *  *text*  => yellow
 *  _text_  => green
 *  `text`  => blue
 *  ~text~  => pink
 *  ^text^  => purple
 */

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const MARKER_MAP = {
  "*": { colorName: "yellow", hex: "#fef08a" },
  "_": { colorName: "green", hex: "#bbf7d0" },
  "`": { colorName: "blue", hex: "#bfdbfe" },
  "~": { colorName: "pink", hex: "#fbcfe8" },
  "^": { colorName: "purple", hex: "#e9d5ff" },
};

const COLOR_OPTIONS = [
  { name: "Yellow", value: MARKER_MAP["*"].hex, symbol: "*" },
  { name: "Green", value: MARKER_MAP["_"].hex, symbol: "_" },
  { name: "Blue", value: MARKER_MAP["`"].hex, symbol: "`" },
  { name: "Pink", value: MARKER_MAP["~"].hex, symbol: "~" },
  { name: "Purple", value: MARKER_MAP["^"].hex, symbol: "^" },
];

const LANG_OPTIONS = ["Spanish", "French", "German", "Hindi", "Chinese", "Japanese"];

export default function NoteViewer({ note, onClose, onNoteUpdated }) {
  const [localNote, setLocalNote] = useState(note);
  const [selectedSymbol, setSelectedSymbol] = useState("*"); // marker symbol
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [translatedSections, setTranslatedSections] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // sync incoming prop
  useEffect(() => {
    setLocalNote(note);
  }, [note]);

  // Helper: server update
  const updateNoteOnServer = async (patch) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/notes/${localNote._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const errJSON = await res.json().catch(() => ({}));
        throw new Error(errJSON.message || "Failed to update note");
      }
      const data = await res.json();
      const updated = data.data || data;
      setLocalNote(updated);
      if (onNoteUpdated) onNoteUpdated(updated);
      return updated;
    } catch (err) {
      console.error(err);
      setError(err.message || "Update failed");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // --- Rendering fullContent with markers replaced by highlight spans ---
  const renderContentHtml = (content) => {
    if (!content) return "";
    // escape HTML first
    const escapeHtml = (s) =>
      s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

    let html = escapeHtml(content);

    // For each marker symbol, replace occurrences of symbol...symbol with a span
    // Use non-greedy regex to handle multiple highlights correctly.
    // e.g., /\*(.+?)\*/g
    Object.keys(MARKER_MAP).forEach((sym) => {
      const hex = MARKER_MAP[sym].hex;
      // Build safe regex: escape backtick and caret for regex
      const escapedSym = sym.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const re = new RegExp(`${escapedSym}(.+?)${escapedSym}`, "gs");
      html = html.replace(re, `<span style="background-color:${hex};padding:2px;border-radius:3px;">$1</span>`);
    });

    // Convert newlines to <br>
    html = html.replace(/\r\n|\r|\n/g, "<br/>");
    return html;
  };

  // --- Apply highlight by inserting markers into fullContent and saving ---
  const handleApplyHighlight = async () => {
    if (!localNote._id) return;
    const selection = window.getSelection();
    if (!selection || !selection.toString()) return;
    const text = selection.toString().trim();
    if (!text) return;

    // Work on raw content string
    const content = localNote.fullContent || localNote.content || "";
    // Find first occurrence of the exact selected text that is not already wrapped with the same symbol.
    // We'll look for index where surrounding characters are not the symbol.
    let idx = -1;
    let startSearch = 0;
    while (startSearch <= content.length) {
      const found = content.indexOf(text, startSearch);
      if (found === -1) break;
      const beforeChar = content[found - 1] || "";
      const afterChar = content[found + text.length] || "";
      const sym = selectedSymbol;
      const alreadyWrapped = beforeChar === sym && afterChar === sym;
      if (!alreadyWrapped) {
        idx = found;
        break;
      }
      startSearch = found + text.length;
    }

    // If not found, fallback to first occurrence
    if (idx === -1) idx = content.indexOf(text);

    if (idx === -1) {
      // Could not find text in raw content; try saving highlight without marker (append to highlights)
      const highlightObj = {
        text,
        color: MARKER_MAP[selectedSymbol].colorName,
        position: undefined,
      };
      const newHighlights = [...(localNote.highlights || []), highlightObj];
      try {
        const updated = await updateNoteOnServer({ highlights: newHighlights });
        setLocalNote(updated);
      } catch (err) {
        // error shown by updateNoteOnServer
      }
      return;
    }

    // Insert marker before and after selected text
    const sym = selectedSymbol;
    const newContent = content.slice(0, idx) + sym + text + sym + content.slice(idx + text.length);

    // Compute positions (for highlight metadata)
    const highlightObj = {
      text,
      color: MARKER_MAP[sym].colorName,
      position: { start: idx, end: idx + text.length + 2 }, // include markers in length to help locate later
      marker: sym,
    };

    const newHighlights = [...(localNote.highlights || []), highlightObj];

    try {
      const updated = await updateNoteOnServer({ fullContent: newContent, highlights: newHighlights });
      setLocalNote(updated);
      // visual highlighting in DOM: selection may be inside the rendered element; attempt to surround
      try {
        const range = selection.getRangeAt(0);
        const span = document.createElement("span");
        span.style.backgroundColor = MARKER_MAP[sym].hex;
        span.style.padding = "2px 0";
        span.style.borderRadius = "2px";
        range.surroundContents(span);
        selection.removeAllRanges();
      } catch (err) {
        // if DOM manipulation fails (cross-node selection), it's ok: marker will show on next render
      }
    } catch (err) {
      // error handled above
    }
  };

  // --- Remove a highlight by index (removes marker from content and updates server) ---
  const removeHighlight = async (index) => {
    const highlights = localNote.highlights || [];
    if (index < 0 || index >= highlights.length) return;
    const h = highlights[index];
    // prefer to remove markerized form if exists
    const content = localNote.fullContent || localNote.content || "";
    const marker = h.marker || detectMarkerForColor(h.color) || "*";
    const pattern = `${marker}${escapeRegExp(h.text)}${marker}`;
    const re = new RegExp(pattern, "g");
    let newContent = content.replace(re, h.text); // remove markers around matching text
    // If nothing changed, also try removing first exact match of text (fallback)
    if (newContent === content) {
      // fallback: just remove the highlight object, don't modify content
      newContent = content;
    }
    const newHighlights = highlights.filter((_, i) => i !== index);
    try {
      const updated = await updateNoteOnServer({ fullContent: newContent, highlights: newHighlights });
      setLocalNote(updated);
    } catch (err) {
      // handled above
    }
  };

  // small helper: detect which marker the color corresponds to
  const detectMarkerForColor = (colorName) => {
    for (const [sym, info] of Object.entries(MARKER_MAP)) {
      if (info.colorName === colorName) return sym;
    }
    return "*";
  };

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // --- Title editing ---
  const onTitleBlur = async (newTitle) => {
    if (!localNote._id) return;
    if ((localNote.title || "") === (newTitle || "")) return;
    try {
      await updateNoteOnServer({ title: newTitle });
    } catch (err) {
      // handled
    }
  };

  // --- Simple mock translate (and optionally persist) ---
  const handleTranslateSection = async (index) => {
    if (!selectedLanguage) return;
    const sections = localNote.structuredNotes?.sections || [];
    const sec = sections[index];
    if (!sec) return;
    const translated = `[${selectedLanguage} translation] ${sec.content}`;
    setTranslatedSections((prev) => ({ ...prev, [index]: translated }));
    try {
      await updateNoteOnServer({
        isTranslated: true,
        translatedContent: {
          language: selectedLanguage,
          content: (localNote.translatedContent?.content || "") + `\nSection ${index}: ${translated}`,
        },
      });
    } catch (err) {
      // handled
    }
  };

  // --- Export PDF using jsPDF dynamically loaded from CDN ---
  const loadJsPdf = () =>
    new Promise((resolve, reject) => {
      if (window.jspdf) return resolve(window.jspdf);
      const src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        // jspdf exposes window.jspdf after load
        if (window.jspdf) return resolve(window.jspdf);
        // the UMD exports default as window.jspdf and as global 'window.jspdf'
        // In some builds, it's available as window.jspdf.jsPDF
        if (window.jspdf || window.jspdf?.jsPDF) return resolve(window.jspdf);
        reject(new Error("Failed to load jsPDF"));
      };
      script.onerror = () => reject(new Error("Failed to load jsPDF script"));
      document.head.appendChild(script);
    });

  const handleExportPdf = async () => {
    try {
      const text = localNote.fullContent || localNote.content || localNote.structuredNotes?.summary || "";
      await loadJsPdf();
      // jsPDF is available as window.jspdf.jsPDF per UMD build
      // Some cdn build puts constructor at window.jspdf.jsPDF
      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) throw new Error("jsPDF not available");
      const doc = new jsPDF({ unit: "pt", compress: true });
      // Add title
      const title = localNote.title || "Note";
      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const usableWidth = pageWidth - margin * 2;
      doc.setFontSize(16);
      doc.text(title, margin, 50);
      doc.setFontSize(11);

      // Convert content HTML (with markers -> spans) to plain text for PDF.
      // We'll replace marker-spans with plain text (no styling) but keep content.
      const plain = (localNote.fullContent || localNote.content || "").replace(/[\*\_\`\~\^]/g, "");
      // Split into lines and add, handling page breaks
      const lines = doc.splitTextToSize(plain, usableWidth);
      let cursorY = 80;
      const lineHeight = 14;
      for (const line of lines) {
        if (cursorY + lineHeight > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += lineHeight;
      }

      const fileName = `${(localNote.title || "note").replace(/\s+/g, "_")}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error(err);
      setError("Failed to export PDF: " + (err.message || ""));
    }
  };

  const handleExport = async (format = "txt") => {
    if (format === "pdf") return handleExportPdf();
    try {
      const text = localNote.fullContent || localNote.content || localNote.structuredNotes?.summary || "";
      let blob;
      let ext = format;
      if (format === "md") {
        blob = new Blob([`# ${localNote.title || ""}\n\n${text}`], { type: "text/markdown" });
      } else {
        blob = new Blob([text], { type: "text/plain" });
        ext = "txt";
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(localNote.title || "note").replace(/\s+/g, "_")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Export failed");
    }
  };

  // --- Helper to show video preview if available ---
  const VideoPreview = ({ video }) => {
    if (!video && !localNote.video) return null;
    // Accept either note.video with fields, or videoId / thumbnail inside note.video
    const v = video || localNote.video || {};
    const videoId = v.videoId || v.videoId || (v.watchUrl ? extractYouTubeId(v.watchUrl) : null);
    const thumbnail = v.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
    const watchUrl = v.watchUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : null);

    if (!thumbnail && !watchUrl) return null;

    return (
      <div className="mb-6 flex items-center gap-4">
        {thumbnail && (
          <a href={watchUrl} target="_blank" rel="noreferrer" className="block w-40 h-24 rounded overflow-hidden">
            <img src={thumbnail} alt="video thumbnail" className="w-full h-full object-cover" />
          </a>
        )}
        <div>
          <p className="text-sm text-gray-600">Notes linked to video:</p>
          <a href={watchUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
            {v.title || watchUrl}
          </a>
        </div>
      </div>
    );
  };

  function extractYouTubeId(url) {
    if (!url) return null;
    const m = url.match(/[?&]v=([^&]+)/);
    if (m && m[1]) return m[1];
    const short = url.match(/youtu\.be\/([^?]+)/);
    if (short && short[1]) return short[1];
    return null;
  }

  // --- JSX ---
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onClose?.()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
            type="button"
            title="Back to notes"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm text-gray-700">Back</span>
          </button>

          <div>
            {/* Editable title */}
            <input
              className="text-2xl font-bold text-gray-900 border-b pb-1 focus:outline-none"
              value={localNote.title || ""}
              onChange={(e) => setLocalNote({ ...localNote, title: e.target.value })}
              onBlur={(e) => onTitleBlur(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Created {localNote.createdAt ? new Date(localNote.createdAt).toLocaleDateString() : "just now"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleExport("pdf")}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 text-sm"
            type="button"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => handleExport("md")}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 text-sm"
            type="button"
          >
            <Download className="w-4 h-4" />
            MD
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Video preview */}
      <VideoPreview />

      {/* Controls: markers + translate */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Highlight:</span>
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.symbol}
              onClick={() => setSelectedSymbol(c.symbol)}
              className={`w-8 h-8 rounded-lg border-2 ${selectedSymbol === c.symbol ? "border-gray-900" : "border-gray-300"} hover:scale-110 transition`}
              style={{ backgroundColor: c.value }}
              type="button"
              title={c.name}
            />
          ))}
          <button
            onClick={handleApplyHighlight}
            disabled={!localNote._id}
            className="ml-2 px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            type="button"
          >
            Apply
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Languages className="w-5 h-5 text-gray-600" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select language</option>
            {LANG_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary (if present) */}
      {localNote.structuredNotes?.summary && (
        <div className="mb-6 p-4 bg-indigo-50 border-l-4 border-indigo-600 rounded-r-xl">
          <h3 className="font-bold text-indigo-900 mb-2">Summary</h3>
          <p className="text-gray-700">{localNote.structuredNotes.summary}</p>
        </div>
      )}

      {/* Content (rendered with marker->span replacement) */}
      <div className="prose max-w-none mb-6">
        <div
          className="text-gray-700 break-words"
          // Render converted HTML: markers -> spans and newlines -> <br/>
          dangerouslySetInnerHTML={{ __html: renderContentHtml(localNote.fullContent || localNote.content || "") }}
        />
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {(localNote.structuredNotes?.sections || []).map((section, index) => (
          <div key={section.heading || index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-900">{section.heading}</h3>
              {selectedLanguage && (
                <button
                  onClick={() => handleTranslateSection(index)}
                  className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-lg hover:bg-purple-200 transition"
                  type="button"
                >
                  Translate
                </button>
              )}
            </div>

            <p className="text-gray-700 mb-4">
              {translatedSections[index] || section.content}
            </p>

            {section.keyPoints && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900">Key points</p>
                <ul className="list-disc list-inside space-y-1">
                  {section.keyPoints.map((pt, pidx) => (
                    <li key={pidx} className="text-gray-700">{pt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Key points */}
      {localNote.structuredNotes?.keyPoints && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-900">Key points summary</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            {localNote.structuredNotes.keyPoints.map((pt, i) => (
              <li key={i} className="text-gray-700">{pt}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Highlights list with remove buttons */}
      {localNote.highlights && localNote.highlights.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-900 mb-2">Highlights</p>
          <div className="grid gap-2">
            {localNote.highlights.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-md border">
                <div>
                  <div className="text-sm text-gray-700 break-words">{h.text}</div>
                  <div className="text-xs text-gray-500">
                    Color: {h.color || h.colorName} {h.position ? ` • pos: ${h.position.start}-${h.position.end}` : ""}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => removeHighlight(i)}
                    className="px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs"
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {localNote.structuredNotes?.tags && localNote.structuredNotes.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {localNote.structuredNotes.tags.map((tag, idx) => (
            <span key={`${tag}-${idx}`} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {saving && <p className="text-sm text-gray-500 mt-4">Saving...</p>}
    </div>
  );
}
