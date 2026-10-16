import express from "express";
import dotenv from "dotenv";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./database/database.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create and start the server using Express directly
const server = app.listen(PORT, async () => {
  console.log(`Express server running on port ${PORT}`);
  await connectDB();
});

// Attach Socket.io to the Express server instance
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

// Real-time connection handler
io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on("join_ticket", (ticketId) => {
    socket.join(`ticket_${ticketId}`);
    console.log(`[Socket.io] Client ${socket.id} joined room ticket_${ticketId}`);
  });

  socket.on("leave_ticket", (ticketId) => {
    socket.leave(`ticket_${ticketId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Make io accessible across all Express route controllers
app.set("io", io);

export default server;