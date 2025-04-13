import { Server, Socket } from "socket.io";
import { fetchRandomProblem } from "../../services/problemService";
import { removePlayerByUserId, startCountdown, ROOMS, findAvailableRoom } from "../../utils/roomManager";
import { IUser } from "../../types";

export default function handleJoinRoom(io: Server, socket: Socket) {
    socket.on("joinRoom", async (data: IUser) => {
        try {
            removePlayerByUserId(data.userId, io);

            let room = findAvailableRoom();
            if (!room) {
                const problemId = await fetchRandomProblem();
                room = `room_${socket.id}`;
                ROOMS[room] = {
                    roomKey: room,
                    players: [],
                    gameStarted: false,
                    problems: problemId,
                };
            }

            ROOMS[room].players.push({
                userId: data.userId,
                username: data.username,
                socketId: socket.id,
                percentage: 0,
            });

            socket.join(room);
            io.to(room).emit("roomUpdate", ROOMS[room]);

            if (ROOMS[room].players.length === 2) {
                startCountdown(room, io);
            }
        } catch (err) {
            console.error("Error in joinRoom:", err);
        }
    });
}
