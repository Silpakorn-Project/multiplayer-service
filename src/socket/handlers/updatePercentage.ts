import { Server, Socket } from "socket.io";
import { IUserPercentage } from "../../types";
import { ROOMS } from "../../utils/roomManager";

export default function handleUpdatePercentage(io: Server, socket: Socket) {
    socket.on("updatePercentage", (user: IUserPercentage) => {
        ROOMS[user.roomKey].players.forEach((player) => {
            if (player.userId === user.userId) {
                player.percentage = user.percentage;
                return;
            }
        }
        );
        io.to(user.roomKey).emit("receivedPercentageUpdatePlayer", ROOMS[user.roomKey].players);
        console.log(`Updated percentage for ${user.userId} in ${user.roomKey}: ${user.percentage}`);
    })
};