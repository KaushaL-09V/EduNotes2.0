import express from "express";
import { protect } from "../middleware/authMiddleware.mjs";
import {
  generateNotes,
  saveNotes,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  translateNote,
  translateText,
  getSupportedLanguages,
} from "../controllers/notesController.mjs";

const router = express.Router();

// All note routes require authentication
router.post("/generate", protect, generateNotes);
router.post("/save", protect, saveNotes);
router.post("/translate-text", protect, translateText); // Must come before /:id routes
router.get("/", protect, getAllNotes);
router.get("/languages", protect, getSupportedLanguages);
router.get("/:id", protect, getNoteById);
router.put("/:id", protect, updateNote);
router.delete("/:id", protect, deleteNote);
router.post("/:id/translate", protect, translateNote);

export default router;