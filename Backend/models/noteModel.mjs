import mongoose from 'mongoose';

const highlightSchema = new mongoose.Schema({
    text: String,
    color: {
        type: String,
        enum: ['yellow', 'green', 'blue', 'pink', 'orange'],
        default: 'yellow'
    },
    position: {
        start: Number,
        end: Number
    }
}, { _id: false });

const noteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    // Keep 'content' for backward compatibility, but use 'fullContent' as primary
    content: {
        type: String,
        default: ''
    },
    fullContent: {
        type: String,
        default: function() {
            return this.content || ''; // Fallback to content if fullContent not set
        }
    },
    structuredNotes: {
        summary: {
            type: String,
            default: ''
        },
        keyPoints: {
            type: [String],
            default: []
        },
        sections: [{
            heading: String,
            content: String
        }],
        // NEW FIELDS for AI-generated notes
        actionItems: {
            type: [String],
            default: []
        },
        examples: {
            type: [String],
            default: []
        },
        tags: {
            type: [String],
            default: []
        }
    },
    highlights: [highlightSchema],
    tags: [{
        type: String,
        trim: true
    }],
    folder: {
        type: String,
        default: 'General',
        index: true
    },
    // NEW FIELD - Track which style was used to generate
    noteStyle: {
        type: String,
        enum: ['concise', 'standard', 'detailed'],
        default: 'standard'
    },
    isTranslated: {
        type: Boolean,
        default: false
    },
    translatedContent: {
        language: String,
        content: String
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    color: {
        type: String,
        default: '#ffffff'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better query performance
noteSchema.index({ user: 1, createdAt: -1 });
noteSchema.index({ user: 1, folder: 1 });
noteSchema.index({ user: 1, tags: 1 });
noteSchema.index({ title: 'text', fullContent: 'text', content: 'text' });

// Virtual for excerpt
noteSchema.virtual('excerpt').get(function () {
    const summary = this.structuredNotes?.summary;
    if (summary) {
        return summary.length > 150 ? summary.substring(0, 150) + '...' : summary;
    }
    const content = this.fullContent || this.content;
    return content ? content.substring(0, 150) + '...' : '';
});

// Pre-save hook to sync content and fullContent
noteSchema.pre('save', function(next) {
    // If fullContent is set but content isn't, sync them
    if (this.fullContent && !this.content) {
        this.content = this.fullContent;
    }
    // If content is set but fullContent isn't, sync them
    if (this.content && !this.fullContent) {
        this.fullContent = this.content;
    }
    next();
});

// Ensure virtuals are included in JSON
noteSchema.set('toJSON', { virtuals: true });
noteSchema.set('toObject', { virtuals: true });

export default mongoose.model('Note', noteSchema);
