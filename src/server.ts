import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import setupSocket from "./socket";
import { getConfig, loadEnv } from "./config/env";

loadEnv(); // โหลด env

const app = express();
const httpServer = createServer(app);
const ENV = getConfig();
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["*"],
    },
});

console.log("ENV", process.env.NODE_ENV);
console.log("BASE_URL_API", ENV.BASE_URL_API);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Setup socket
setupSocket(io);

httpServer.listen(5555, () => {
    console.log("Server running on port 5555");
});
