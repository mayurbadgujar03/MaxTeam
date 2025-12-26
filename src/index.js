import app from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: "./.env" });
}

let isConnected = false;

export default async (req, res) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:8080",
    "https://flowbase-frontend.vercel.app"
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (error) {
      console.error("MongoDB connection failed:", error);
      return res.status(500).json({ error: "Database connection failed" });
    }
  }

  // Pass to Express app
  return app(req, res);
};

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
    })
    .catch((err) => {
      console.error("MongoDB connection error", err);
      process.exit(1);
    });
}
