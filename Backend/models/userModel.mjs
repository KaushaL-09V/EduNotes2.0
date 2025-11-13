import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    // Keep savedNotes for backward compatibility
    savedNotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note'
    }],
    // NEW FIELDS - User preferences
    avatar: {
        type: String,
        default: ''
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'light'
        },
        defaultNoteStyle: {
            type: String,
            enum: ['concise', 'standard', 'detailed'],
            default: 'standard'
        },
        language: {
            type: String,
            default: 'en'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to update last login
userSchema.methods.updateLastLogin = async function () {
    this.lastLogin = new Date();
    await this.save({ validateBeforeSave: false });
};

// Virtual for notes (dynamic relationship)
userSchema.virtual('notes', {
    ref: 'Note',
    localField: '_id',
    foreignField: 'user'
});

// Virtual for videos (dynamic relationship)
userSchema.virtual('videos', {
    ref: 'Video',
    localField: '_id',
    foreignField: 'uploadedBy'
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { 
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.password;
        return ret;
    }
});

userSchema.set('toObject', { 
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.password;
        return ret;
    }
});

export default mongoose.model('User', userSchema);