// src/controllers/notesController.mjs
import aiService from "../services/aiService.mjs";
import Video from "../models/videoModel.mjs";
import Note from "../models/noteModel.mjs";
import User from "../models/userModel.mjs"
/**
 * POST /api/notes/generate
 * Generate AI notes from transcript
 */
export const generateNotes = async (req, res) => {
  try {
    const { transcript, title, videoId, noteStyle = "standard" } = req.body;

    console.log("=== BACKEND: Generate Notes Request ===");
    console.log("Received noteStyle:", noteStyle);
    console.log("Request body keys:", Object.keys(req.body));

    // Validation
    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Transcript is required",
      });
    }

    // Validate noteStyle
    const validStyles = ['concise', 'standard', 'detailed'];
    const selectedStyle = validStyles.includes(noteStyle) ? noteStyle : 'standard';

    if (noteStyle !== selectedStyle) {
      console.warn(`Invalid note style '${noteStyle}' provided, using '${selectedStyle}' instead`);
    }

    console.log(`Generating ${selectedStyle} notes for video: ${title || videoId}`);

    // Generate notes using AI service with selected style
    const structuredNotes = await aiService.generateNotes(
      transcript,
      title || "Video Notes",
      selectedStyle
    );

    console.log("AI Service returned notes with structure:", {
      hasSummary: !!structuredNotes.summary,
      keyPointsCount: structuredNotes.keyPoints?.length || 0,
      hasSections: !!structuredNotes.sections,
      sectionsCount: structuredNotes.sections?.length || 0,
    });

    // Generate full content for storage/display
    const fullContent = aiService.generateFullContent(structuredNotes);

    console.log("Sending response with noteStyle:", selectedStyle);

    // Return the generated notes
    return res.status(200).json({
      success: true,
      data: {
        structuredNotes,
        fullContent,
        noteStyle: selectedStyle,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Error generating notes:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate notes",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * POST /api/notes/save
 * Save generated notes to database
 */
export const saveNotes = async (req, res) => {
  try {
    const { videoId, title, structuredNotes, tags, folder, noteStyle } = req.body;
    const userId = req.user?._id;

    console.log("=== BACKEND: Save Notes Request ===");
    console.log("User ID:", userId);
    console.log("Video ID:", videoId);

    // Validation
    if (!videoId || !structuredNotes) {
      return res.status(400).json({
        success: false,
        message: "Video ID and structured notes are required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Generate full content
    const fullContent = aiService.generateFullContent(structuredNotes);

    // Create new note with both content and fullContent for compatibility
    const newNote = new Note({
      user: userId,
      video: videoId,
      title: title || video.title || "Untitled Notes",
      structuredNotes,
      content: fullContent, // Backward compatibility
      fullContent: fullContent, // New field
      tags: tags || structuredNotes.tags || [],
      folder: folder || "General",
      noteStyle: noteStyle || "standard", // Track generation style
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newNote.save();

    // Populate video details for response
    await newNote.populate('video');

    // Add note to user's savedNotes array if it exists
    if (req.user.savedNotes !== undefined) {
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { savedNotes: newNote._id } },
        { new: true }
      );
    }

    console.log(`✅ Notes saved successfully for video: ${video.title}`);

    return res.status(201).json({
      success: true,
      message: "Notes saved successfully",
      data: newNote,
    });

  } catch (error) {
    console.error("❌ Error saving notes:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save notes",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * GET /api/notes
 * Get all notes for the authenticated user
 */
export const getAllNotes = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { folder, tag, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    console.log("=== BACKEND: Get All Notes ===");
    console.log("User ID:", userId);
    console.log("Filters:", { folder, tag, search });

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Build query
    const query = { user: userId };

    if (folder) {
      query.folder = folder;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { fullContent: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with sorting
    const notes = await Note.find(query)
      .populate('video', 'title videoId url thumbnail')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .lean();

    console.log(`✅ Found ${notes.length} notes`);

    return res.status(200).json({
      success: true,
      count: notes.length,
      data: notes,
    });

  } catch (error) {
    console.error("❌ Error fetching notes:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch notes",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * GET /api/notes/:id
 * Get a specific note by ID
 */
export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    console.log("=== BACKEND: Get Note By ID ===");
    console.log("Note ID:", id);
    console.log("User ID:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const note = await Note.findOne({ _id: id, user: userId })
      .populate('video');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or you don't have permission to access it",
      });
    }

    console.log(`✅ Note found: ${note.title}`);

    return res.status(200).json({
      success: true,
      data: note,
    });

  } catch (error) {
    console.error("❌ Error fetching note:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch note",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * PUT /api/notes/:id
 * Update a note
 */
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const updates = req.body;

    console.log("=== BACKEND: Update Note ===");
    console.log("Note ID:", id);
    console.log("User ID:", userId);
    console.log("Updates:", Object.keys(updates));

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Find note and verify ownership
    const note = await Note.findOne({ _id: id, user: userId });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or you don't have permission to update it",
      });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'structuredNotes', 'tags', 'folder', 'fullContent'];
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        note[key] = updates[key];
      }
    });

    // If structuredNotes were updated, regenerate fullContent
    if (updates.structuredNotes) {
      note.fullContent = aiService.generateFullContent(updates.structuredNotes);
    }

    note.updatedAt = new Date();
    await note.save();
    await note.populate('video');

    console.log(`✅ Note updated: ${note.title}`);

    return res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: note,
    });

  } catch (error) {
    console.error("❌ Error updating note:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update note",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    console.log("=== BACKEND: Delete Note ===");
    console.log("Note ID:", id);
    console.log("User ID:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Find and delete note (only if user owns it)
    const note = await Note.findOneAndDelete({ _id: id, user: userId });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or you don't have permission to delete it",
      });
    }

    console.log(`✅ Note deleted: ${note.title}`);

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully",
      data: { id: note._id },
    });

  } catch (error) {
    console.error("❌ Error deleting note:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete note",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * PUT /api/notes/:id/regenerate
 * Regenerate notes with a different style
 */
export const regenerateNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { noteStyle = "standard" } = req.body;
    const userId = req.user?._id;

    console.log("=== BACKEND: Regenerate Notes ===");
    console.log("Note ID:", id);
    console.log("New Style:", noteStyle);
    console.log("User ID:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Find existing note and verify ownership
    const note = await Note.findOne({ _id: id, user: userId }).populate('video');
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or you don't have permission to regenerate it",
      });
    }

    // Get the transcript from the video
    const video = note.video;
    if (!video || !video.transcript) {
      return res.status(400).json({
        success: false,
        message: "Video transcript not available",
      });
    }

    // Regenerate notes with new style
    const structuredNotes = await aiService.generateNotes(
      video.transcript,
      note.title,
      noteStyle
    );

    const fullContent = aiService.generateFullContent(structuredNotes);

    // Update the note
    note.structuredNotes = structuredNotes;
    note.fullContent = fullContent;
    note.tags = structuredNotes.tags || note.tags;
    note.updatedAt = new Date();

    await note.save();

    console.log(`✅ Notes regenerated with ${noteStyle} style for: ${note.title}`);

    return res.status(200).json({
      success: true,
      message: "Notes regenerated successfully",
      data: note,
    });

  } catch (error) {
    console.error("❌ Error regenerating notes:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to regenerate notes",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * POST /api/notes/:id/translate
 * Translate a note to a different language
 */
export const translateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetLang } = req.body;
    const userId = req.user?._id;

    console.log("=== BACKEND: Translate Note ===");
    console.log("Note ID:", id);
    console.log("Target Language:", targetLang);
    console.log("User ID:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!targetLang) {
      return res.status(400).json({
        success: false,
        message: "Target language is required",
      });
    }

    // Find note and verify ownership
    const note = await Note.findOne({ _id: id, user: userId }).populate('video');
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found or you don't have permission to translate it",
      });
    }

    // Import translation service
    const translationService = await import('../services/translationService.mjs');

    // Translate structured notes
    const translationResult = await translationService.translateStructuredNotes(
      note.structuredNotes,
      targetLang
    );

    if (!translationResult.success) {
      return res.status(500).json({
        success: false,
        message: "Translation failed",
        error: translationResult.error
      });
    }

    // Generate full content from translated notes
    const translatedFullContent = aiService.generateFullContent(translationResult.translatedNotes);

    console.log(`✅ Note translated successfully to ${targetLang}`);

    return res.status(200).json({
      success: true,
      message: "Note translated successfully",
      data: {
        translatedNotes: translationResult.translatedNotes,
        translatedFullContent,
        targetLang,
        originalNote: {
          _id: note._id,
          title: note.title
        }
      },
    });

  } catch (error) {
    console.error("❌ Error translating note:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to translate note",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * POST /api/notes/translate-text
 * Translate arbitrary text
 */
export const translateText = async (req, res) => {
  try {
    const { text, targetLang, sourceLang = 'auto' } = req.body;
    const userId = req.user?._id;

    console.log("=== BACKEND: Translate Text ===");
    console.log("Target Language:", targetLang);
    console.log("Source Language:", sourceLang);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!text || !targetLang) {
      return res.status(400).json({
        success: false,
        message: "Text and target language are required",
      });
    }

    // Import translation service
    const translationService = await import('../services/translationService.mjs');

    // Translate text
    const result = await translationService.translateText(text, targetLang, sourceLang);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Translation failed",
        error: result.error
      });
    }

    console.log(`✅ Text translated from ${result.sourceLang} to ${targetLang}`);

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("❌ Error translating text:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to translate text",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * GET /api/notes/languages
 * Get list of supported languages
 */
export const getSupportedLanguages = async (req, res) => {
  try {
    const translationService = await import('../services/translationService.mjs');
    const languages = translationService.getSupportedLanguages();

    return res.status(200).json({
      success: true,
      data: languages,
    });
  } catch (error) {
    console.error("❌ Error fetching languages:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch supported languages",
    });
  }
};

export default {
  generateNotes,
  saveNotes,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  regenerateNotes,
  translateNote,
  translateText,
  getSupportedLanguages,
};