import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173"
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Sprint 12 Real-Time WebSocket Server is running"
  });
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-room", ({ room, userId, username }) => {
    if (!room || !userId || !username) return;

    const previousRoom = socket.data.room;
    if (previousRoom && previousRoom !== room) {
      socket.leave(previousRoom);
      socket.to(previousRoom).emit("system-message", {
        id: crypto.randomUUID(),
        text: `${socket.data.username || "A user"} left the room`,
        createdAt: new Date().toISOString()
      });
    }

    socket.join(room);
    socket.data.room = room;
    socket.data.userId = userId;
    socket.data.username = username;

    socket.emit("room-joined", { room, socketId: socket.id });

    socket.to(room).emit("system-message", {
      id: crypto.randomUUID(),
      text: `${username} joined the room`,
      createdAt: new Date().toISOString()
    });
  });

  socket.on("chat-message", ({ room, userId, username, text }) => {
    if (!room || !userId || !username || !text?.trim()) return;

    const payload = {
      id: crypto.randomUUID(),
      room,
      userId,
      username,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    io.to(room).emit("chat-message", payload);
  });

  socket.on("typing", ({ room, username, isTyping }) => {
    if (!room) return;
    socket.to(room).emit("typing", {
      socketId: socket.id,
      username,
      isTyping
    });
  });

  socket.on("disconnect", () => {
    const { room, username } = socket.data;

    if (room && username) {
      socket.to(room).emit("system-message", {
        id: crypto.randomUUID(),
        text: `${username} disconnected`,
        createdAt: new Date().toISOString()
      });
    }

    console.log("Client disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});