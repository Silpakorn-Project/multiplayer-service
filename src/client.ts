import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.emit("joinRoom");

socket.on("roomUpdate", (room) => {
  console.log(`Room updated: ${JSON.stringify(room)}`);
});

socket.on("message", (msg) => {
  console.log("Received message:", msg);
});
