import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

import healthCheckRouter from "./routes/healthcheck.routes.js";
import userAuth from "./routes/auth.routes.js";
import dashboardStats from "./routes/dashboard.routes.js";
import projectNotes from "./routes/note.routes.js";
import project from "./routes/project.routes.js";
import task from "./routes/task.routes.js";
import notification from "./routes/notification.routes.js";
import publicRouter from "./routes/public.routes.js";
import feedbackRouter from "./routes/feedback.routes.js";
import adminRouter from "./routes/admin.routes.js";

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : [
    "http://localhost:5173",
    "http://localhost:8080",
    "https://flowbaseapp.vercel.app",
    "https://flowbase.mayurbadgujar.me",
    "https://mayurbadgujar.me",      // Added Portfolio (HTTPS)
    "http://mayurbadgujar.me"        // Added Portfolio (HTTP)
  ];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/user", userAuth);
app.use("/api/v1/dashboard", dashboardStats);
app.use("/api/v1/project-note", projectNotes);
app.use("/api/v1/project", project);
app.use("/api/v1/task", task);
app.use("/api/v1/notifications", notification);

app.use("/api/v1/public", publicRouter);
app.use("/api/v1/feedback", feedbackRouter);
app.use("/api/v1/admin", adminRouter);

app.use("/api/public", publicRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/admin", adminRouter);

export default app;
