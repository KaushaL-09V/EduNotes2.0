import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { apiRequest, downloadFile } from "../lib/apiClient";
import { useAuth } from "./AuthContext.jsx";

const NotesContext = createContext();

export const NotesProvider = ({ children }) => {
  const { token } = useAuth();
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async () => {
    if (!token) {
      setNotes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest("/api/notes");
      const items = response?.data?.notes ?? [];
      setNotes(items);
    } catch (err) {
      console.error("Failed to fetch notes", err);
      setError(err.message || "Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotes().catch(() => {
      // error handled in fetchNotes
    });
  }, [fetchNotes]);

  const generateNotes = async ({ transcript, title, videoId }) => {
    const response = await apiRequest("/api/notes/generate", {
      method: "POST",
      body: { transcript, title, videoId },
    });

    return response?.data?.notes;
  };

  const saveNote = async ({ videoId, title, structuredNotes, tags, folder }) => {
    const content = structuredNotes?.fullContent || structuredNotes?.content;
    const response = await apiRequest("/api/notes/save", {
      method: "POST",
      body: {
        videoId,
        title,
        content,
        structuredNotes,
        tags,
        folder,
      },
    });

    const saved = response?.data?.note;
    if (saved) {
      setNotes((prev) => [saved, ...prev]);
      setCurrentNote(saved);
    }

    return saved;
  };

  const deleteNote = async (noteId) => {
    await apiRequest(`/api/notes/${noteId}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((note) => note._id !== noteId));
    if (currentNote?._id === noteId) {
      setCurrentNote(null);
    }
  };

  const updateNote = async (noteId, update) => {
    const response = await apiRequest(`/api/notes/${noteId}`, {
      method: "PATCH",
      body: update,
    });

    const updated = response?.data?.note;
    if (updated) {
      setNotes((prev) => prev.map((note) => (note._id === noteId ? updated : note)));
      if (currentNote?._id === noteId) {
        setCurrentNote(updated);
      }
    }

    return updated;
  };

  const addHighlight = async (noteId, highlight) => {
    const response = await apiRequest(`/api/notes/${noteId}/highlight`, {
      method: "POST",
      body: highlight,
    });

    const updated = response?.data?.note;
    if (updated) {
      setNotes((prev) => prev.map((note) => (note._id === noteId ? updated : note)));
      if (currentNote?._id === noteId) {
        setCurrentNote(updated);
      }
    }

    return updated;
  };

  const exportNote = async (noteId, format, title = "note") => {
    const safeFormat = format.toLowerCase();
    const safeTitle = title.replace(/[^a-z0-9_-]/gi, "_");
    await downloadFile(`/api/notes/${noteId}/export/${safeFormat}`, `${safeTitle}.${safeFormat}`);
  };

  const value = {
    notes,
    currentNote,
    setCurrentNote,
    loading,
    error,
    fetchNotes,
    generateNotes,
    saveNote,
    deleteNote,
    updateNote,
    addHighlight,
    exportNote,
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
};

export const useNotes = () => useContext(NotesContext);
