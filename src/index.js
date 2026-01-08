import app from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: "./.env" });
}

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || [
      "http://localhost:5173",
      "http://localhost:8080",
      "https://flowbaseapp.vercel.app"
    ],
    credentials: true
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("join_project", (id) => {
    socket.join(id);
    console.log(`Socket ${socket.id} joined project room ${id}`);
  });

  socket.on("join_user", (id) => {
    socket.join(id);
    console.log(`Socket ${socket.id} joined user room ${id}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 8000;
connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });
