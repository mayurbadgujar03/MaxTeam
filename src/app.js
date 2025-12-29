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

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:8080",
      "https://flowbaseapp.vercel.app"
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
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

export default app;
