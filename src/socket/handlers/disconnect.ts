import { Server, Socket } from "socket.io";
import { ROOMS } from "../../utils/roomManager";

export default function handleDisconnect(io: Server, socket: Socket) {
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
    })
};