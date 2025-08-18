import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

//router imports
import healthCheckRouter from "./routes/healthcheck.routes.js";
import userAuth from "./routes/auth.routes.js";
import projectNotes from "./routes/note.routes.js";
import project from "./routes/project.routes.js";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    cors({
        origin: process.env.BASE_URL,
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/user", userAuth);
app.use("/api/v1/project-note", projectNotes);
app.use("/api/v1/project", project);

export default app;
