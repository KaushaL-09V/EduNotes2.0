import express from "express";
import { protect } from "../middleware/authMiddleware.mjs";
import {
  generateNotes,
  saveNotes,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from "../controllers/notesController.mjs";

const router = express.Router();

// All note routes require authentication
router.post("/generate", protect, generateNotes);
router.post("/save", protect, saveNotes);
router.get("/", protect, getAllNotes);
router.get("/:id", protect, getNoteById);
router.put("/:id", protect, updateNote);
router.delete("/:id", protect, deleteNote);

export default router;