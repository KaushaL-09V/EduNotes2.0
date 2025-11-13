import { useState } from "react";
import { useNotes } from "../Context/NotesContext";
import { Video, Sparkles, Loader2, Save, CheckCircle, AlertCircle, FileText, List, BookOpen } from "lucide-react";
import NoteViewer from "./NoteViewer";
import FolderSelectModal from "../Components/FolderSelectModal";
import { apiRequest } from "../lib/apiClient";

// Note generation styles with their configurations
const NOTE_STYLES = {
  concise: {
    id: "concise",
    label: "Concise",
    icon: List,
    description: "Brief summary with key points",
    color: "bg-blue-500"
  },
  standard: {
    id: "standard",
    label: "Standard",
    icon: FileText,
    description: "Balanced coverage with sections",
    color: "bg-indigo-500"
  },
  detailed: {
    id: "detailed",
    label: "Detailed",
    icon: BookOpen,
    description: "Comprehensive notes with examples",
    color: "bg-purple-500"
  }
};

function GenerateNotes() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [transcriptData, setTranscriptData] = useState(null);
  const [error, setError] = useState("");
  const [generatedNotes, setGeneratedNotes] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState("standard");
  const [generatedWithStyle, setGeneratedWithStyle] = useState(null);
  const [loading, setLoading] = useState({
    transcript: false,
    notes: false,
    saving: false
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [showFolderModal, setShowFolderModal] = useState(false);
  const { setCurrentNote } = useNotes();

  // Clear generated notes when style changes
  const handleStyleChange = (newStyle) => {
    if (newStyle !== selectedStyle) {
      setSelectedStyle(newStyle);
      if (generatedNotes) {
        setGeneratedNotes(null);
        setGeneratedWithStyle(null);
        setSuccessMessage("Note style changed. Click 'Generate' to create new notes.");
      }
    }
  };

  const resetMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const handleFetchTranscript = async () => {
    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    resetMessages();
    setTranscriptData(null);
    setGeneratedNotes(null);
    setGeneratedWithStyle(null);
    setLoading(prev => ({ ...prev, transcript: true }));

    try {
      const response = await apiRequest("/api/transcript/fetch", {
        method: "POST",
        body: { videoUrl: url, title: title.trim() || undefined },
      });

      const payload = response?.data;
      
      if (!payload) {
        throw new Error("No data received from server");
      }

      let processedData;
      const transcriptPayload = payload?.transcript;
      
      if (transcriptPayload && typeof transcriptPayload === "object" && "transcript" in transcriptPayload) {
        processedData = {
          transcript: transcriptPayload.transcript,
          title: transcriptPayload.title || payload?.title || title.trim() || "Untitled Video",
          videoId: transcriptPayload.videoId || payload?.videoId,
          videoDatabaseId: transcriptPayload._id || payload?._id,
          languageUsed: transcriptPayload.languageUsed || payload?.languageUsed || "unknown"
        };
      } else if (typeof payload.transcript === "string") {
        processedData = {
          transcript: payload.transcript,
          title: payload.title || title.trim() || "Untitled Video",
          videoId: payload.videoId,
          videoDatabaseId: payload._id,
          languageUsed: payload.languageUsed || "unknown"
        };
      } else {
        throw new Error("Transcript not available for this video");
      }

      if (!processedData.transcript || processedData.transcript.trim().length === 0) {
        throw new Error("Empty transcript received. This video may not have captions available.");
      }

      setTranscriptData(processedData);
      setSuccessMessage("Transcript fetched successfully!");
      
      if (!title.trim() && processedData.title) {
        setTitle(processedData.title);
      }
    } catch (err) {
      console.error("Transcript fetch error:", err);
      setError(err.message || "Failed to fetch transcript. Please check the URL and try again.");
    } finally {
      setLoading(prev => ({ ...prev, transcript: false }));
    }
  };

  const handleGenerateNotes = async () => {
    if (!transcriptData?.transcript) {
      setError("Please fetch the transcript first");
      return;
    }

    resetMessages();
    setLoading(prev => ({ ...prev, notes: true }));

    try {
      console.log("Generating notes with style:", selectedStyle);
      
      const response = await apiRequest("/api/notes/generate", {
        method: "POST",
        body: {
          transcript: transcriptData.transcript,
          title: title.trim() || transcriptData.title || "Video Notes",
          videoId: transcriptData.videoDatabaseId || transcriptData.videoId,
          noteStyle: selectedStyle
        },
      });

      const notes = response?.data?.structuredNotes || response?.data;

      if (!notes) {
        throw new Error("No notes generated from server");
      }

      if (!notes.summary && !notes.keyPoints) {
        throw new Error("Received invalid notes structure from AI");
      }

      setGeneratedNotes(notes);
      setGeneratedWithStyle(selectedStyle);
      setSuccessMessage(`${NOTE_STYLES[selectedStyle].label} notes generated successfully! Review and save them below.`);
      
      setCurrentNote({
        title: title.trim() || transcriptData.title || "AI Generated Notes",
        structuredNotes: notes,
        createdAt: new Date().toISOString(),
        video: {
          url: url,
          videoId: transcriptData.videoId,
          title: transcriptData.title
        },
      });
    } catch (err) {
      console.error("Notes generation error:", err);
      setError(err.message || "Failed to generate notes. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, notes: false }));
    }
  };

  const handleSaveClick = () => {
    if (!generatedNotes) {
      setError("No notes to save");
      return;
    }

    const mongoId = transcriptData?.videoDatabaseId || transcriptData?._id;
    
    if (!mongoId) {
      setError("Video database ID not found. Please fetch the transcript again.");
      return;
    }

    resetMessages();
    setShowFolderModal(true);
  };

  const handleSaveNotes = async (folderName) => {
    const mongoId = transcriptData?.videoDatabaseId || transcriptData?._id;
    
    setLoading(prev => ({ ...prev, saving: true }));

    try {
      const response = await apiRequest("/api/notes/save", {
        method: "POST",
        body: {
          videoId: mongoId,
          title: title.trim() || transcriptData.title || "AI Generated Notes",
          structuredNotes: generatedNotes,
          tags: generatedNotes.tags || [],
          folder: folderName,
          noteStyle: generatedWithStyle || selectedStyle,
        },
      });

      const savedNote = response?.data;

      if (savedNote) {
        setSuccessMessage(`✓ Notes saved to "${folderName}" folder successfully!`);
        setCurrentNote(savedNote);
        setShowFolderModal(false);
        
        setTimeout(() => {
          setUrl("");
          setTitle("");
          setTranscriptData(null);
          setGeneratedNotes(null);
          setGeneratedWithStyle(null);
          setSuccessMessage("");
        }, 3000);
      } else {
        throw new Error("Failed to save notes");
      }
    } catch (err) {
      console.error("Save notes error:", err);
      setError(err.message || "Failed to save notes. Please try again.");
      setShowFolderModal(false);
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const extractYouTubeId = (url) => {
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Video className="w-6 h-6 text-indigo-600" />
          Generate AI Notes
        </h2>
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              YouTube Video URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="https://youtube.com/watch?v=..."
              disabled={loading.transcript}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">
              Video Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Give this video a custom name"
              disabled={loading.transcript}
            />
          </div>

          <button
            onClick={handleFetchTranscript}
            disabled={!url.trim() || loading.transcript}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading.transcript ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Fetching Transcript...
              </>
            ) : (
              "Fetch Transcript"
            )}
          </button>

          {/* Messages */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-600">{successMessage}</p>
            </div>
          )}

          {/* YouTube Thumbnail Preview */}
          {url && extractYouTubeId(url) && (
            <a
              href={`https://www.youtube.com/watch?v=${extractYouTubeId(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block mx-auto w-full sm:w-2/3 md:w-1/2 rounded-xl border border-gray-200 shadow-md overflow-hidden bg-gray-100 aspect-video hover:shadow-lg hover:-translate-y-0.5 transition-transform duration-200"
            >
              <div className="relative w-full h-full">
                <img
                  src={`https://img.youtube.com/vi/${extractYouTubeId(url)}/hqdefault.jpg`}
                  alt="YouTube Thumbnail"
                  className="w-full h-full object-cover rounded-xl"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-600 bg-opacity-90 p-3 sm:p-4 rounded-full shadow-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M10 15l5.19-3L10 9v6zm12-3c0-1.76-.18-3.52-.52-5.23-.26-1.2-1.04-2.16-2.11-2.7A47.78 47.78 0 0012 3a47.78 47.78 0 00-7.37 1.07c-1.07.54-1.85 1.5-2.11 2.7C2.18 8.48 2 10.24 2 12c0 1.76.18 3.52.52 5.23.26 1.2 1.04 2.16 2.11 2.7A47.78 47.78 0 0012 21a47.78 47.78 0 007.37-1.07c1.07-.54 1.85-1.5 2.11-2.7.34-1.71.52-3.47.52-5.23z" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          )}

          {/* Transcript Preview with Note Style Selection */}
          {transcriptData && (
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl space-y-4 border border-indigo-100">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Transcript Ready</h3>
                  <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                    {transcriptData.languageUsed || "unknown"}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {transcriptData.title}
                </p>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 line-clamp-4">
                    {transcriptData.transcript}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {transcriptData.transcript.length.toLocaleString()} characters
                </p>
              </div>

              {/* Note Style Selector */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">
                  Choose Note Style
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.values(NOTE_STYLES).map((style) => {
                    const Icon = style.icon;
                    const isSelected = selectedStyle === style.id;
                    
                    return (
                      <button
                        key={style.id}
                        onClick={() => handleStyleChange(style.id)}
                        disabled={loading.notes}
                        className={`p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          isSelected
                            ? `${style.color} bg-opacity-10 border-current`
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex flex-col items-center text-center gap-2">
                          <div
                            className={`p-2 rounded-lg ${
                              isSelected ? style.color : "bg-gray-100"
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 ${
                                isSelected ? "text-white" : "text-gray-600"
                              }`}
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {style.label}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {style.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleGenerateNotes}
                disabled={loading.notes}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading.notes ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating {NOTE_STYLES[selectedStyle].label} Notes...
                  </>
                ) : generatedNotes && generatedWithStyle !== selectedStyle ? (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Regenerate as {NOTE_STYLES[selectedStyle].label}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate {NOTE_STYLES[selectedStyle].label} Notes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Generated Notes Section */}
      {generatedNotes && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white rounded-xl shadow-lg p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">Your AI-Generated Notes</h3>
                {generatedWithStyle && (
                  <span className={`text-xs px-2 py-1 rounded-full text-white ${NOTE_STYLES[generatedWithStyle].color}`}>
                    {NOTE_STYLES[generatedWithStyle].label}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Review and save to your library
                {generatedWithStyle && selectedStyle !== generatedWithStyle && (
                  <span className="text-amber-600 ml-1">
                    • Style changed, regenerate for {NOTE_STYLES[selectedStyle].label} notes
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleSaveClick}
              disabled={loading.saving}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save to Library
            </button>
          </div>

          <NoteViewer
            note={{
              _id: "preview",
              title: title.trim() || transcriptData?.title || "AI Generated Notes",
              structuredNotes: generatedNotes,
              createdAt: new Date().toISOString(),
              video: {
                url: url,
                videoId: transcriptData?.videoId,
                title: transcriptData?.title
              },
            }}
          />
        </div>
      )}

      {/* Folder Selection Modal */}
      <FolderSelectModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSave={handleSaveNotes}
        isLoading={loading.saving}
      />
    </div>
  );
}

export default GenerateNotes;