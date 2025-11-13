// MyNotes.jsx
import { useEffect, useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import NoteViewer from "./NoteViewer";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function MyNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [activeNote, setActiveNote] = useState(null);

  // Fetch all notes for the logged in user
  const fetchNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/notes", {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) {
        const errJSON = await res.json().catch(() => ({}));
        throw new Error(errJSON.message || "Failed to fetch notes");
      }
      const data = await res.json();
      const payload = Array.isArray(data) ? data : data.data || [];
      setNotes(payload);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // categories from folder field (case-insensitive uniqueness)
  const categories = useMemo(() => {
    const set = new Set(notes.map((n) => (n.folder || "General").trim()));
    return ["All", ...Array.from(set)];
  }, [notes]);

  const filteredNotes = useMemo(() => {
    if (selectedCategory === "all") return notes;
    return notes.filter((note) => (note.folder || "General").trim() === selectedCategory);
  }, [notes, selectedCategory]);

  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
      }
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      return 0;
    });
  }, [filteredNotes, sortBy]);

  // When a note card is clicked, fetch full note details (in case listing is partial)
  const openNote = async (id) => {
    setActiveNoteId(id);
    setActiveNote(null);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) {
        const errJSON = await res.json().catch(() => ({}));
        throw new Error(errJSON.message || "Failed to load note");
      }
      const data = await res.json();
      const note = data.data || data;
      setActiveNote(note);
      // Scroll to top of the notes container so viewer is visible
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setError("Failed to open note: " + (err.message || ""));
      setActiveNoteId(null);
    }
  };

  const closeNote = () => {
    setActiveNoteId(null);
    setActiveNote(null);
  };

  // Delete note
  const handleDelete = async (id) => {
    if (!confirm("Delete this note? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) {
        const errJSON = await res.json().catch(() => ({}));
        throw new Error(errJSON.message || "Failed to delete");
      }
      // remove locally
      setNotes((prev) => prev.filter((n) => n._id !== id));
      if (activeNoteId === id) closeNote();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to delete note");
    }
  };

  // Export note: simple client-side export (txt/md/pdf (text-backed) )
  const exportNoteClient = async (id, format = "txt", fileName = "note") => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) {
        const errJSON = await res.json().catch(() => ({}));
        throw new Error(errJSON.message || "Failed to export");
      }
      const payload = await res.json();
      const note = payload.data || payload;
      const text = note.fullContent || note.content || note.structuredNotes?.summary || "";
      let blob;
      let ext = format;
      if (format === "pdf") {
        blob = new Blob([text], { type: "application/pdf" });
      } else if (format === "md") {
        blob = new Blob([`# ${note.title || ""}\n\n${text}`], { type: "text/markdown" });
      } else {
        blob = new Blob([text], { type: "text/plain" });
        ext = "txt";
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError(err.message || "Export failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Notes Library</h2>

          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category === "All" ? "all" : category)}
              className={`px-4 py-2 rounded-xl font-medium transition ${
                (category === "All" && selectedCategory === "all") || category === selectedCategory
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading && <p className="text-gray-500">Loading your saved notes...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {/* If a note is active, render the NoteViewer inline (replaces the grid). */}
        {activeNoteId && activeNote ? (
          <NoteViewer
            note={activeNote}
            onClose={closeNote}
            onNoteUpdated={(updated) => {
              // update local notes list
              setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
              setActiveNote(updated);
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sortedNotes.map((note) => (
                <div
                  key={note._id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-indigo-300 transition-all group cursor-pointer"
                  onClick={() => openNote(note._id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition">
                          {note.title}
                        </h3>
                        <p className="text-sm text-gray-500">{note.folder || "General"}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {note.structuredNotes?.summary || note.fullContent?.slice(0, 160) || note.content?.slice(0, 160) || "No summary available."}
                  </p>

                  {note.structuredNotes?.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {note.structuredNotes.tags.map((tag, idx) => (
                        <span key={`${tag}-${idx}`} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openNote(note._id);
                      }}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                    >
                      View Notes
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportNoteClient(note._id, "txt", note.title || "note");
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      type="button"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note._id);
                      }}
                      className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm"
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!loading && !error && sortedNotes.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No notes found in this category.</p>
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
                >
                  View All Notes
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
