import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["*"],
  },
});

interface DetailRoomType {
  userId: string;
  username: string;
  socketId: string;
}

// const ROOMS: { [key: string]: string[] } = {};
const ROOMS: { [key: string]: DetailRoomType[]} = {};

const MAX_PLAYERS: number = 4;

interface DataType {
  userId: string;
  username: string;
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

function findAvailableRoom(): string | null {
  for (const room in ROOMS) {
    if (ROOMS[room].length < MAX_PLAYERS) {
      return room;
    }
  }
  return null;
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // เมื่อผู้ใช้เข้าร่วมระบบ
  socket.on("joinRoom", (data: DataType) => {
    let room = findAvailableRoom();

    if (!room) {
      room = `room_${socket.id}`; // สร้างห้องใหม่ถ้าไม่มีห้องว่าง
      ROOMS[room] = [];
      console.log(`Created new room: ${room}`);
    }

    // ROOMS[room].push(socket.id);
    ROOMS[room].push({
      userId: data.userId,
      username: data.username,
      socketId: socket.id
    });

    socket.join(room);
    console.log(`User ${socket.id} joined ${room}`);
    io.to(room).emit("roomUpdate", ROOMS[room]);

    // เมื่อผู้เล่นออกจากระบบ
    // disconnect room
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      // ROOMS[room] = ROOMS[room].filter((id) => id !== socket.id);
      ROOMS[room] = ROOMS[room].filter((detail) => detail.socketId !== socket.id);

      if (ROOMS[room].length === 0) {
        delete ROOMS[room];
        console.log(`Room ${room} deleted because it's empty.`);
      } else {
        io.to(room).emit("roomUpdate", ROOMS[room]);
      }
    });
  });

  setInterval(() => {
    io.emit("server time", new Date().toISOString());
  }, 1000);

  //disconeect server
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  // รับข้อความแล้วส่งให้ทุกคนในห้องเดียวกัน
  socket.on("message", (msg: string) => {
    // const room = Object.keys(ROOMS).find((r) => ROOMS[r].includes(socket.id));
    const room = Object.keys(ROOMS).find((r) => ROOMS[r].some((detail) => detail.socketId === socket.id)); // หาห้องที่มี socket.id นี้อยู่
    if (room) {
      console.log(`Received message in ${room}:`, msg);
      socket.to(room).emit("message", msg);
    }
  });
});

httpServer.listen(5555, () => {
  console.log("Server running on port 5555")
});