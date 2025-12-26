import app from "../src/app.js";
import connectDB from "../src/db/index.js";

let isConnected = false;

const handler = async (req, res) => {
  // Connect to MongoDB if not already connected
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (error) {
      console.error("MongoDB connection failed:", error);
      return res.status(500).json({ error: "Database connection failed" });
    }
  }

  // Handle the request with Express app
  return app(req, res);
};

export default handler;
