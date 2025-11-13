// src/routes/transcriptRoutes.js

import express from 'express';
import {
  getTranscript,
  getVideoById,
} from '../controllers/transcriptController.mjs';
import { protect } from '../middleware/authMiddleware.mjs';

const router = express.Router();
// All routes are protected
router.use(protect);

// POST /api/transcript/fetch - Fetch transcript from YouTube
router.post("/fetch", getTranscript);

// GET /api/transcript/:videoId - Get video by ID
router.get("/:videoId", getVideoById);

export default router;
