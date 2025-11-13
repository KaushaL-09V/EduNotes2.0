// src/controllers/transcriptController.js
import transcriptService from "../services/transcriptService.mjs";
import Video from "../models/videoModel.mjs";

/**
 * @desc    Fetch transcript from YouTube video
 * @route   POST /api/transcript/fetch
 * @access  Private
 */
export const getTranscript = async (req, res, next) => {
  try {
    const { videoUrl, title } = req.body;
    const userId = req.user?._id;

    console.log("=== BACKEND: Fetch Transcript ===");
    console.log("Video URL:", videoUrl);
    console.log("User ID:", userId);

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: "Video URL is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Extract video ID from URL
    const videoId = transcriptService.extractVideoId(videoUrl);
    
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube URL",
      });
    }

    console.log("Video ID:", videoId);

    // Check if video already exists for this user
    let video = await Video.findOne({ 
      videoId: videoId, 
      $or: [
        { uploadedBy: userId },
        { user: userId }
      ]
    });

    if (video) {
      console.log("✅ Video transcript already exists in database");
      
      return res.status(200).json({
        success: true,
        message: "Transcript retrieved from database",
        data: {
          _id: video._id,
          videoId: video.videoId,
          title: video.title,
          transcript: video.transcript,
          languageUsed: video.languageUsed || video.language || 'unknown',
          transcriptSegments: video.transcriptSegments || 0,
          thumbnail: video.thumbnail,
          url: video.url,
        },
      });
    }

    // Fetch transcript from YouTube
    console.log("🔄 Fetching transcript from YouTube...");
    const transcriptData = await transcriptService.fetchT(videoUrl);

    // Create new video record
    video = new Video({
      videoId: transcriptData.videoId,
      url: transcriptData.url,
      title: title || transcriptData.title || "Untitled Video",
      transcript: transcriptData.transcript,
      transcriptSegments: transcriptData.transcriptSegments || 0,
      language: transcriptData.languageUsed || 'en',
      languageUsed: transcriptData.languageUsed || 'en',
      thumbnail: `https://img.youtube.com/vi/${transcriptData.videoId}/hqdefault.jpg`,
      uploadedBy: userId,
      user: userId, // Set both fields for compatibility
    });

    await video.save();

    console.log("✅ Transcript fetched and saved successfully");

    return res.status(201).json({
      success: true,
      message: "Transcript fetched successfully",
      data: {
        _id: video._id,
        videoId: video.videoId,
        title: video.title,
        transcript: video.transcript,
        languageUsed: video.languageUsed,
        transcriptSegments: video.transcriptSegments,
        thumbnail: video.thumbnail,
        url: video.url,
      },
    });

  } catch (error) {
    console.error("❌ Error fetching transcript:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch transcript",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * @desc    Get video by ID
 * @route   GET /api/transcript/:videoId
 * @access  Private
 */
export const getVideoById = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { video },
    });
  } catch (error) {
    next(error);
  }
};