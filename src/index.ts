import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {

  console.log(`User connected: ${socket.id}`);

  socket.on("message", (msg: string) => {
    console.log("Received:", msg);
    socket.broadcast.emit("message", msg);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });

});

httpServer.listen(3000, () => console.log("Server running on port 3000"));