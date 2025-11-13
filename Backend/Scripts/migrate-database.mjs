// scripts/migrate-database.mjs
// Run this once to update existing records with new fields
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Note from '../models/userModel.mjs';
import Video from '../models/videoModel.mjs';
import User from '../models/userModel.mjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edunote';

async function migrateDatabase() {
    try {
        console.log('🔄 Connecting to database...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to database');

        // Migrate Notes
        console.log('\n📝 Migrating Notes...');
        await migrateNotes();

        // Migrate Videos
        console.log('\n🎥 Migrating Videos...');
        await migrateVideos();

        // Migrate Users
        console.log('\n👤 Migrating Users...');
        await migrateUsers();

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

async function migrateNotes() {
    const notes = await Note.find({});
    console.log(`Found ${notes.length} notes to migrate`);

    let updated = 0;
    for (const note of notes) {
        let needsUpdate = false;

        // Add fullContent if missing (copy from content)
        if (!note.fullContent && note.content) {
            note.fullContent = note.content;
            needsUpdate = true;
        }

        // Add default noteStyle if missing
        if (!note.noteStyle) {
            note.noteStyle = 'standard';
            needsUpdate = true;
        }

        // Ensure structuredNotes has all required fields
        if (!note.structuredNotes) {
            note.structuredNotes = {};
        }
        
        if (!note.structuredNotes.actionItems) {
            note.structuredNotes.actionItems = [];
            needsUpdate = true;
        }
        
        if (!note.structuredNotes.examples) {
            note.structuredNotes.examples = [];
            needsUpdate = true;
        }

        if (!note.structuredNotes.tags) {
            note.structuredNotes.tags = note.tags || [];
            needsUpdate = true;
        }

        // Add color if missing
        if (!note.color) {
            note.color = '#ffffff';
            needsUpdate = true;
        }

        if (needsUpdate) {
            await note.save();
            updated++;
        }
    }

    console.log(`✅ Updated ${updated} notes`);
}

async function migrateVideos() {
    const videos = await Video.find({});
    console.log(`Found ${videos.length} videos to migrate`);

    let updated = 0;
    for (const video of videos) {
        let needsUpdate = false;

        // Add languageUsed if missing (copy from language)
        if (!video.languageUsed && video.language) {
            video.languageUsed = video.language;
            needsUpdate = true;
        } else if (!video.languageUsed) {
            video.languageUsed = 'en';
            needsUpdate = true;
        }

        // Sync user field with uploadedBy
        if (!video.user && video.uploadedBy) {
            video.user = video.uploadedBy;
            needsUpdate = true;
        }

        // Add thumbnail if missing
        if (!video.thumbnail && video.videoId) {
            video.thumbnail = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
            needsUpdate = true;
        }

        // Add transcriptSegments if missing
        if (!video.transcriptSegments || video.transcriptSegments === 0) {
            // Estimate segments from transcript (roughly count sentences)
            const segments = video.transcript ? video.transcript.split(/[.!?]+/).length : 0;
            video.transcriptSegments = segments;
            needsUpdate = true;
        }

        // Add category if missing
        if (!video.category) {
            video.category = 'Education';
            needsUpdate = true;
        }

        if (needsUpdate) {
            await video.save();
            updated++;
        }
    }

    console.log(`✅ Updated ${updated} videos`);
}

async function migrateUsers() {
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);

    let updated = 0;
    for (const user of users) {
        let needsUpdate = false;

        // Add preferences if missing
        if (!user.preferences) {
            user.preferences = {
                theme: 'light',
                defaultNoteStyle: 'standard',
                language: 'en'
            };
            needsUpdate = true;
        }

        // Add isActive if missing
        if (user.isActive === undefined) {
            user.isActive = true;
            needsUpdate = true;
        }

        if (needsUpdate) {
            await user.save();
            updated++;
        }
    }

    console.log(`✅ Updated ${updated} users`);
}

// Run migration
migrateDatabase();

// Usage:
// node scripts/migrate-database.mjs