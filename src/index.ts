import { Server } from "socket.io";


const io = new Server(3000, {
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
