# 📚 EduNote Backend

AI-powered video note-taking system that transforms YouTube videos into structured, comprehensive notes.

## 🚀 Features

- ✅ YouTube transcript extraction
- 🤖 AI-powered note generation (OpenAI/GPT)
- 📝 Structured notes with summaries and key points
- 🎨 Text highlighting with multiple colors
- 🌍 Multi-language translation support
- 📁 Organized folder management
- 📄 Export notes as PDF, TXT, or Markdown
- 🔐 Secure JWT authentication
- 🏷️ Tagging and categorization

## 📁 Project Structure

```
edunote-backend/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── models/
│   │   ├── userModel.js           # User schema
│   │   ├── videoModel.js          # Video schema
│   │   └── noteModel.js           # Note schema
│   ├── controllers/
│   │   ├── authController.js      # Auth logic
│   │   ├── transcriptController.js # Transcript fetching
│   │   └── notesController.js     # Notes CRUD
│   ├── services/
│   │   ├── aiService.js           # OpenAI integration
│   │   ├── transcriptService.js   # YouTube transcript
│   │   └── translationService.js  # Translation
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth
│   │   ├── transcriptRoutes.js    # /api/transcript
│   │   └── noteRoutes.js          # /api/notes
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification
│   │   └── errorHandler.js        # Error handling
│   ├── utils/
│   │   ├── jwt.js                 # JWT utilities
│   │   └── pdfGenerator.js        # Export utilities
│   ├── app.js                     # Express setup
│   └── server.js                  # Server entry
├── .env                           # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🛠️ Tech Stack

| Component      | Technology           |
| -------------- | -------------------- |
| Runtime        | Node.js              |
| Framework      | Express.js           |
| Database       | MongoDB + Mongoose   |
| Authentication | JWT + bcrypt         |
| AI             | OpenAI API           |
| Transcript     | youtube-transcript   |
| Translation    | Google Translate API |
| PDF Export     | PDFKit               |

## ⚙️ Setup Instructions

### 1. Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- OpenAI API key
- (Optional) Google Translate API key

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd edunote-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `.env` file:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/edunote

JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d

OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-3.5-turbo

GOOGLE_TRANSLATE_API_KEY=your-translate-key
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

## 📡 API Endpoints

### Authentication

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Register new user |
| POST   | `/api/auth/login`    | User login        |
| GET    | `/api/auth/me`       | Get current user  |

### Transcript

| Method | Endpoint                   | Description                |
| ------ | -------------------------- | -------------------------- |
| POST   | `/api/transcript/fetch`    | Extract YouTube transcript |
| GET    | `/api/transcript/:videoId` | Get video details          |

### Notes

| Method | Endpoint                        | Description         |
| ------ | ------------------------------- | ------------------- |
| POST   | `/api/notes/generate`           | Generate AI notes   |
| POST   | `/api/notes/save`               | Save notes to DB    |
| GET    | `/api/notes`                    | Get all user notes  |
| GET    | `/api/notes/:id`                | Get single note     |
| PATCH  | `/api/notes/:id`                | Update note         |
| DELETE | `/api/notes/:id`                | Delete note         |
| POST   | `/api/notes/:id/highlight`      | Add highlight       |
| GET    | `/api/notes/:id/export/:format` | Export (pdf/txt/md) |

## 🔐 Authentication Flow

1. User registers: `POST /api/auth/register`

   ```json
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "password123"
   }
   ```

2. Receive JWT token in response
3. Include token in subsequent requests:
   ```
   Authorization: Bearer <token>
   ```

## 📝 Usage Example

### Complete Workflow

```javascript
// 1. Register/Login
POST /api/auth/register
{
  "name": "Student",
  "email": "student@example.com",
  "password": "secure123"
}

// 2. Fetch Transcript
POST /api/transcript/fetch
Headers: { Authorization: Bearer <token> }
{
  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "title": "Machine Learning Basics"
}

// 3. Generate Notes
POST /api/notes/generate
{
  "transcript": "<transcript from step 2>",
  "title": "Machine Learning Basics",
  "videoId": "<video_id from step 2>"
}

// 4. Save Notes
POST /api/notes/save
{
  "videoId": "<video_id>",
  "title": "ML Notes",
  "content": "<generated content>",
  "structuredNotes": { /* AI generated structure */ },
  "tags": ["machine-learning", "ai"],
  "folder": "Computer Science"
}

// 5. Export Notes
GET /api/notes/:id/export/pdf
```

## 🧪 Testing with Postman

### Import Collection

1. Create new collection in Postman
2. Set environment variable: `{{BASE_URL}}` = `http://localhost:5000`
3. Set `{{TOKEN}}` after login

### Sample Requests

**1. Register User**

```
POST {{BASE_URL}}/api/auth/register
Body (JSON):
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

**2. Login**

```
POST {{BASE_URL}}/api/auth/login
Body (JSON):
{
  "email": "test@example.com",
  "password": "password123"
}
```

_Save the token from response to `{{TOKEN}}`_

**3. Fetch Transcript**

```
POST {{BASE_URL}}/api/transcript/fetch
Headers:
  Authorization: Bearer {{TOKEN}}
Body (JSON):
{
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "Sample Video"
}
```

## 🚢 Deployment

### Deploy to Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect repository
4. Set environment variables
5. Deploy

### Deploy to Railway

```bash
railway login
railway init
railway add
railway up
```

### Deploy to AWS

Use AWS Elastic Beanstalk or EC2 with PM2:

```bash
pm2 start server.js --name edunote-backend
pm2 save
pm2 startup
```

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Helmet.js for HTTP headers
- ✅ CORS protection
- ✅ Input validation
- ✅ Error handling middleware
- ✅ Rate limiting ready

## 📊 Database Schema

### User

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (user/admin),
  savedNotes: [ObjectId]
}
```

### Video

```javascript
{
  videoId: String (unique),
  url: String,
  title: String,
  transcript: String,
  uploadedBy: ObjectId
}
```

### Note

```javascript
{
  user: ObjectId,
  video: ObjectId,
  title: String,
  content: String,
  structuredNotes: {
    summary: String,
    keyPoints: [String],
    sections: [{heading, content}]
  },
  highlights: [{text, color, position}],
  tags: [String],
  folder: String
}
```

## 🐛 Troubleshooting

**MongoDB Connection Failed**

- Check MONGO_URI in .env
- Verify network access in MongoDB Atlas
- Ensure IP whitelist includes your IP

**OpenAI API Error**

- Verify OPENAI_API_KEY is valid
- Check API quota/billing
- Ensure model name is correct

**Transcript Not Found**

- Verify video has captions enabled
- Check video URL format
- Try different video

## 📚 Resources

- [Express.js Docs](https://expressjs.com/)
- [MongoDB Docs](https://www.mongodb.com/docs/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [JWT.io](https://jwt.io/)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - feel free to use this project for learning and development.

## 👥 Team

Created by the EduNote Team

---

**Happy Note-Taking! 📝✨**
