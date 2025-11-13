// server.js
import dotenv from 'dotenv';
dotenv.config();
import app from './app.mjs';
import connectDB from './config/db.mjs';
const PORT = process.env.PORT || 5000;
// Connect to MongoDB
connectDB();
// Start server
app.listen(PORT, () => {
    console.log(`🚀 EduNote Backend running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
    process.exit(1);
});