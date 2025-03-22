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

const ROOMS: { [key: string]: DetailRoomType[] } = {};
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

function removePlayerByUserId(userId: string) {
  try {
    // ทำสำเนาของ keys เพื่อป้องกันการแก้ไขใน loop
    const roomKeys = Object.keys(ROOMS);
    
    for (const room of roomKeys) {
      if (!ROOMS[room]) continue;
      
      const index = ROOMS[room].findIndex((detail) => detail.userId === userId);
      if (index !== -1) {
        const removed = ROOMS[room][index];
        const socketInstance = io.sockets.sockets.get(removed.socketId);
        
        if (socketInstance) {
          io.to(removed.socketId).emit("forceDisconnect", "You have been replaced by a new connection.");
          socketInstance.disconnect();
        }

        // ตรวจสอบอีกครั้งว่า room ยังคงมีอยู่
        if (ROOMS[room]) {
          ROOMS[room].splice(index, 1);
          
          if (ROOMS[room].length === 0) {
            delete ROOMS[room];
            console.log(`Room ${room} deleted because it's empty.`);
          } else {
            io.to(room).emit("roomUpdate", ROOMS[room]);
          }
        }
        
        break;
      }
    }
  } catch (error) {
    console.error("Error in removePlayerByUserId:", error);
  }
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  let currentRoom: string | null = null;

  // เมื่อผู้ใช้เข้าร่วมระบบ
  socket.on("joinRoom", (data: DataType) => {
    try {
      // ตรวจสอบและลบ userId เก่าถ้ามี
      removePlayerByUserId(data.userId);

      let room = findAvailableRoom();

      if (!room) {
        room = `room_${socket.id}`; // สร้างห้องใหม่ถ้าไม่มีห้องว่าง
        ROOMS[room] = [];
        console.log(`Created new room: ${room}`);
      }

      ROOMS[room].push({
        userId: data.userId,
        username: data.username,
        socketId: socket.id
      });

      socket.join(room);
      console.log(`User ${socket.id} joined ${room}`);
      io.to(room).emit("roomUpdate", ROOMS[room]);

      // บันทึกห้องปัจจุบัน
      currentRoom = room;
    } catch (error) {
      console.error("Error in joinRoom:", error);
    }
  });

  // เมื่อผู้เล่นออกจากระบบ
  socket.on("disconnect", () => {
    try {
      console.log(`User disconnected: ${socket.id}`);
      
      // ตรวจสอบทุกห้องเพื่อหาและลบผู้เล่น
      for (const room in ROOMS) {
        if (ROOMS[room]) {
          const playerIndex = ROOMS[room].findIndex(player => player.socketId === socket.id);
          
          if (playerIndex !== -1) {
            ROOMS[room].splice(playerIndex, 1);
            
            if (ROOMS[room].length === 0) {
              delete ROOMS[room];
              console.log(`Room ${room} deleted because it's empty.`);
            } else {
              io.to(room).emit("roomUpdate", ROOMS[room]);
            }
            
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error in disconnect handler:", error);
    }
  });

  // รับข้อความแล้วส่งให้ทุกคนในห้องเดียวกัน
  socket.on("message", (msg: string) => {
    try {
      const room = Object.keys(ROOMS).find((r) => 
        ROOMS[r] && ROOMS[r].some((detail) => detail.socketId === socket.id)
      );
      
      if (room) {
        console.log(`Received message in ${room}:`, msg);
        socket.to(room).emit("message", msg);
      }
    } catch (error) {
      console.error("Error in message handler:", error);
    }
  });
});

// ไม่ต้องทำ setInterval สำหรับแต่ละการเชื่อมต่อ ให้ทำที่นี่แทน
setInterval(() => {
  io.emit("server time", new Date().toISOString());
}, 1000);

httpServer.listen(5555, () => {
  console.log("Server running on port 5555");
});