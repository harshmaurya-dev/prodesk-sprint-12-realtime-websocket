import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
const allowedRooms = new Set(["general", "tech"]);
const origins = [
  ...(process.env.CLIENT_URL || "").split(",").map((value) => value.trim()),
  "http://localhost:5173",
].filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: origins,
    methods: ["GET", "POST"],
  },
});

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "Prodesk Sprint 12 real-time server is running",
    rooms: [...allowedRooms],
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy" });
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-room", (payload = {}) => {
    const room = String(payload.room || "");
    const userId = String(payload.userId || "").trim();
    const username = String(payload.username || "").trim().slice(0, 32);

    if (!allowedRooms.has(room) || !userId || !username) {
      socket.emit("app-error", { message: "Choose a valid room and username." });
      return;
    }

    const previousRoom = socket.data.room;
    const previousUsername = socket.data.username;

    if (previousRoom && previousRoom !== room) {
      socket.leave(previousRoom);
      socket.to(previousRoom).emit("system-message", {
        id: randomUUID(),
        room: previousRoom,
        text: `${previousUsername} left #${previousRoom}`,
        createdAt: new Date().toISOString(),
      });
    }

    socket.join(room);
    socket.data = { room, userId, username };

    socket.emit("room-joined", { room, socketId: socket.id });
    socket.to(room).emit("system-message", {
      id: randomUUID(),
      room,
      text: `${username} joined #${room}`,
      createdAt: new Date().toISOString(),
    });
  });

  socket.on("chat-message", (payload = {}) => {
    const room = socket.data.room;
    const message = String(payload.text || "").trim();

    // Only allow messages in the room the socket has actually joined.
    if (!room || payload.room !== room || !socket.data.userId || !message) return;

    io.to(room).emit("chat-message", {
      id: randomUUID(),
      room,
      userId: socket.data.userId,
      username: socket.data.username,
      text: message.slice(0, 2000),
      createdAt: new Date().toISOString(),
    });
  });

  socket.on("typing", (payload = {}) => {
    const room = socket.data.room;
    if (!room || payload.room !== room) return;

    socket.to(room).emit("typing", {
      socketId: socket.id,
      username: socket.data.username,
      isTyping: Boolean(payload.isTyping),
    });
  });

  socket.on("disconnect", () => {
    const { room, username } = socket.data || {};
    if (room && username) {
      socket.to(room).emit("system-message", {
        id: randomUUID(),
        room,
        text: `${username} disconnected`,
        createdAt: new Date().toISOString(),
      });
    }
    console.log("Client disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Sprint 12 server listening on port ${PORT}`);
});
