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

interface RoomType {
  players: DetailRoomType[];
  gameStarted: boolean;
}

const ROOMS: { [key: string]: RoomType } = {};
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
    if (ROOMS[room].players.length < MAX_PLAYERS && !ROOMS[room].gameStarted) {
      return room;
    }
  }
  return null;
}

function startCountdown(room: string) {
  let countdown = 10;
  let countdownInterval: NodeJS.Timeout | null = null;

  const resetCountdown = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    countdown = 10;
    io.to(room).emit("countdown", countdown);
  };

  const checkAndStartCountdown = () => {
    if (!ROOMS[room] || ROOMS[room].players.length < 2) {
      resetCountdown(); // ถ้าผู้เล่นออกก่อนเริ่ม ให้รีเซ็ต
      return;
    }

    if (!countdownInterval) {
      countdownInterval = setInterval(() => {
        if (!ROOMS[room] || ROOMS[room].players.length < 2) {
          resetCountdown();
          return;
        }

        io.to(room).emit("countdown", countdown);
        console.log(`Countdown for ${room}: ${countdown}`);

        if (countdown === 0) {
          clearInterval(countdownInterval!);
          countdownInterval = null;
          io.to(room).emit("gameStart"); // ส่งไปให้ client เปลี่ยนหน้า
          console.log(`Game started for ${room}`);
        }
        countdown--;
      }, 1000);
    }
  };

  checkAndStartCountdown();
}

function removePlayerByUserId(userId: string) {
  try {
    // ทำสำเนาของ keys เพื่อป้องกันการแก้ไขใน loop
    const roomKeys = Object.keys(ROOMS);
    
    for (const room of roomKeys) {
      if (!ROOMS[room]) continue;
      
      const index = ROOMS[room].players.findIndex((detail) => detail.userId === userId);
      if (index !== -1) {
        const removed = ROOMS[room].players[index];
        const socketInstance = io.sockets.sockets.get(removed.socketId);
        
        if (socketInstance) {
          io.to(removed.socketId).emit("forceDisconnect", "You have been replaced by a new connection.");
          socketInstance.disconnect();
        }

        // ตรวจสอบอีกครั้งว่า room ยังคงมีอยู่
        if (ROOMS[room]) {
          ROOMS[room].players.splice(index, 1);
          
          if (ROOMS[room].players.length === 0) {
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
        ROOMS[room] = { players: [], gameStarted: false };
        console.log(`Created new room: ${room}`);
      }

      ROOMS[room].players.push({
        userId: data.userId,
        username: data.username,
        socketId: socket.id
      });

      socket.join(room);
      console.log(`User ${socket.id} joined ${room}`);
      io.to(room).emit("roomUpdate", ROOMS[room]);

      // บันทึกห้องปัจจุบัน
      currentRoom = room;

      // ถ้ามีผู้เล่นครบ 2 คน ให้เริ่มนับถอยหลัง
      if (ROOMS[room].players.length === 2) {
        startCountdown(room);
      }

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
          const playerIndex = ROOMS[room].players.findIndex(player => player.socketId === socket.id);
          
          if (playerIndex !== -1) {
            ROOMS[room].players.splice(playerIndex, 1);
            
            if (ROOMS[room].players.length === 0) {
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
        ROOMS[r] && ROOMS[r].players.some((detail) => detail.socketId === socket.id)
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