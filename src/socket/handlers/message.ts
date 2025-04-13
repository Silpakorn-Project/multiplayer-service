import { Server, Socket } from "socket.io";
import { ROOMS } from "../../utils/roomManager";

export default function handleMessage(io: Server, socket: Socket) {
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
    })
}
;