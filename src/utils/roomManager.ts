import { Server } from "socket.io";
import { IRoomDetails } from "../types";

export const ROOMS: { [key: string]: IRoomDetails } = {};
const MAX_PLAYERS = 4;

export function findAvailableRoom(): string | null {
    for (const room in ROOMS) {
        if (ROOMS[room].players.length < MAX_PLAYERS && !ROOMS[room].gameStarted) {
            return room;
        }
    }
    return null;
}

export function startCountdown(room: string, io: Server) {
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

                    // update game started status
                    ROOMS[room].gameStarted = true;

                    io.to(room).emit("roomUpdate", ROOMS[room]);

                    console.log(`Game started for ${room}`);
                }
                countdown--;
            }, 1000);
        }
    };

    checkAndStartCountdown();
}

export function removePlayerByUserId(userId: number, io: Server) {
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