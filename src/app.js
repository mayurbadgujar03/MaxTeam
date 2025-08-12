import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

//router imports
import healthCheckRouter from "./routes/healthcheck.routes.js";

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

export default app;
