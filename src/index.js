import dotenv from "dotenv";
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: "./.env" });
}

import app from "./app.js";
import connectDB from "./db/index.js";
import { createServer } from "http";

const httpServer = createServer(app);

const PORT = process.env.PORT || 8080;
connectDB()
  .then(() => {
    httpServer.listen(PORT);
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });
