import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import { env } from "./config/env.js";
import { assertDatabaseConnection, pool } from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import applicantRoutes from "./routes/applicantRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import screeningRoutes from "./routes/screeningRoutes.js";
import admissionRoutes from "./routes/admissionRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import clarificationRoutes from "./routes/clarificationRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// Middlewares
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();
app.disable("x-powered-by");

// Security Headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS configuration
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.CLIENT_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow during development
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body and Cookie Parsers
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
app.use("/api/", apiLimiter);

// Health Check Endpoint
async function healthHandler(_req, res) {
  let dbStatus = "disconnected";
  try {
    const isConnected = await assertDatabaseConnection();
    if (isConnected) dbStatus = "connected";
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  return res.json({
    success: true,
    service: "CrediFit Admission Screening Register API",
    version: "1.0.0",
    status: "ok",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);
app.get("/api/v1/health", healthHandler);

// Register routes helper
function mountRoutes(prefix) {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/applicants`, applicantRoutes);
  app.use(`${prefix}/courses`, courseRoutes);
  app.use(`${prefix}/applications`, applicationRoutes);
  app.use(`${prefix}/documents`, documentRoutes);
  app.use(`${prefix}/screening`, screeningRoutes);
  app.use(`${prefix}/admission`, admissionRoutes);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/clarifications`, clarificationRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
}

// Mount under both /api and /api/v1 for 100% compatibility
mountRoutes("/api");
mountRoutes("/api/v1");

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    console.log("Checking MySQL database connectivity...");
    try {
      await assertDatabaseConnection();
      console.log(" MySQL Database connected successfully!");
    } catch (dbErr) {
      console.warn(" MySQL connection check warning:", dbErr.message);
      console.warn("Please ensure MySQL service is running and credentials in backend/.env are correct.");
    }

    const server = app.listen(env.PORT, () => {
      console.log(` CrediFit Backend running at http://localhost:${env.PORT}`);
      console.log(` Health check available at http://localhost:${env.PORT}/health`);
      console.log(` Environment: ${env.NODE_ENV}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down CrediFit API...`);
      server.close(async () => {
        try {
          await pool.end();
        } catch (_) {}
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start CrediFit Backend:", error.message);
    process.exit(1);
  }
}

startServer();

export default app;
