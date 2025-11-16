import { useState, useEffect } from "react";
import { X, Folder, Plus, Check, Loader2 } from "lucide-react";
import { apiRequest } from "../lib/apiClient";

function FolderSelectModal({ isOpen, onClose, onSave, isLoading }) {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("General");
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
    }
  }, [isOpen]);

  const fetchFolders = async () => {
    setLoadingFolders(true);
    setError("");
    try {
      const response = await apiRequest("/api/notes/folders");
      const folderList = response?.data || [];
      
      // Add default folder if not present
      if (!folderList.includes("General")) {
        folderList.unshift("General");
      }
      
      setFolders(folderList);
      
      // Auto-select General if no selection
      if (!selectedFolder || !folderList.includes(selectedFolder)) {
        setSelectedFolder("General");
      }
    } catch (err) {
      console.error("Error fetching folders:", err);
      // Don't show error, just use default folders
      setFolders(["General", "Personal", "Work", "Study"]);
      setSelectedFolder("General");
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleSave = () => {
    const folderToSave = isCreatingNew ? newFolderName.trim() : selectedFolder;
    
    if (!folderToSave) {
      setError("Please select or create a folder");
      return;
    }

    if (isCreatingNew && folderToSave.length > 50) {
      setError("Folder name must be less than 50 characters");
      return;
    }

    onSave(folderToSave);
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setNewFolderName("");
    setError("");
  };

  const handleCancelNew = () => {
    setIsCreatingNew(false);
    setNewFolderName("");
    setError("");
  };

  const handleClose = () => {
    setIsCreatingNew(false);
    setNewFolderName("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Folder className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-bold text-gray-900">Save to Folder</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {loadingFolders ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : isCreatingNew ? (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                New Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
                maxLength={50}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCancelNew}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newFolderName.trim()) {
                      setIsCreatingNew(false);
                      setSelectedFolder(newFolderName.trim());
                    }
                  }}
                  disabled={!newFolderName.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Use This Folder
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Folder
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {folders.map((folder) => (
                    <button
                      key={folder}
                      onClick={() => {
                        setSelectedFolder(folder);
                        setError("");
                      }}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                        selectedFolder === folder
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Folder
                          className={`w-5 h-5 ${
                            selectedFolder === folder
                              ? "text-indigo-600"
                              : "text-gray-400"
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            selectedFolder === folder
                              ? "text-indigo-900"
                              : "text-gray-700"
                          }`}
                        >
                          {folder}
                        </span>
                      </div>
                      {selectedFolder === folder && (
                        <Check className="w-5 h-5 text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateNew}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-indigo-600"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create New Folder</span>
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || (!selectedFolder && !newFolderName.trim())}
            className="flex-1 px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Save Notes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FolderSelectModal;