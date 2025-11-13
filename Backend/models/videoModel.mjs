import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
    videoId: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    url: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: String,
        default: ''
    },
    channelName: {
        type: String,
        default: ''
    },
    transcript: {
        type: String,
        required: true
    },
    // NEW FIELD - Number of transcript segments
    transcriptSegments: {
        type: Number,
        default: 0
    },
    // Rename 'language' to 'languageUsed' for consistency
    // But keep both for backward compatibility
    language: {
        type: String,
        default: 'en'
    },
    languageUsed: {
        type: String,
        default: function() {
            return this.language || 'en';
        }
    },
    // NEW FIELD - Thumbnail URL
    thumbnail: {
        type: String,
        default: function() {
            return this.videoId ? `https://img.youtube.com/vi/${this.videoId}/hqdefault.jpg` : '';
        }
    },
    // Change field name for clarity (uploadedBy -> user)
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Add 'user' as alias for consistency with other models
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: function() {
            return this.uploadedBy;
        }
    },
    // Additional metadata
    publishedAt: {
        type: Date
    },
    viewCount: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        default: 'Education'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries - make videoId + user unique
videoSchema.index({ videoId: 1, uploadedBy: 1 }, { unique: true });
videoSchema.index({ user: 1, createdAt: -1 });

// Virtual for YouTube embed URL
videoSchema.virtual('embedUrl').get(function () {
    return `https://www.youtube.com/embed/${this.videoId}`;
});

// Virtual for watch URL
videoSchema.virtual('watchUrl').get(function () {
    return `https://www.youtube.com/watch?v=${this.videoId}`;
});

// Pre-save hook to sync fields
videoSchema.pre('save', function(next) {
    // Sync languageUsed with language
    if (this.language && !this.languageUsed) {
        this.languageUsed = this.language;
    }
    if (this.languageUsed && !this.language) {
        this.language = this.languageUsed;
    }
    
    // Sync user with uploadedBy
    if (this.uploadedBy && !this.user) {
        this.user = this.uploadedBy;
    }
    if (this.user && !this.uploadedBy) {
        this.uploadedBy = this.user;
    }
    
    next();
});

// Ensure virtuals are included in JSON
videoSchema.set('toJSON', { virtuals: true });
videoSchema.set('toObject', { virtuals: true });

export default mongoose.model('Video', videoSchema);
