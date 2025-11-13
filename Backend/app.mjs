  import express from "express";
  import cors from "cors";
  import helmet from "helmet";
  import morgan from "morgan";

  // Import routes
  import authRoutes from "./routes/authRoutes.mjs";
  import transcriptRoutes from "./routes/transcriptRoutes.mjs";
  import noteRoutes from "./routes/noteRoutes.mjs";

  // Import middleware
  import errorHandler from "./middleware/errorHandler.mjs";

  const app = express();
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:5173", // Vite dev server
  ];
  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: function (origin, callback) {
        // allow requests with no origin like curl/postman
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
          return callback(null, true);
        } else {
          return callback(new Error("CORS policy: Origin not allowed"), false);
        }
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // Body parser middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Logging middleware
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // Health check route
  app.get("/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "EduNote Backend is running",
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/transcript", transcriptRoutes);
  app.use("/api/notes", noteRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  export default app;
