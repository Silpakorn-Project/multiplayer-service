import { Server } from "socket.io";
import handleJoinRoom from "./handlers/joinRoom";
import handleDisconnect from "./handlers/disconnect";
import handleMessage from "./handlers/message";
import handleUpdatePercentage from "./handlers/updatePercentage";

export default function setupSocket(io: Server) {
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        handleJoinRoom(io, socket);
        handleDisconnect(io, socket);
        handleMessage(io, socket);
        handleUpdatePercentage(io, socket);

        setInterval(() => {
            io.emit("server time", new Date().toISOString());
        }, 1000);
    });
}
