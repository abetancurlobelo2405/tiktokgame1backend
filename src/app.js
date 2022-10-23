import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { WebcastPushConnection } from "tiktok-live-connector";

const TIKTOK_USERNAME = "sharylroderick2213";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    method: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  let tiktokLiveConnection = new WebcastPushConnection(TIKTOK_USERNAME);
  tiktokLiveConnection
    .connect()
    .then((state) => {
      console.info(`Connected to roomId ${state.roomId}`);
    })
    .catch((error) => {
      console.error("Failed to connect", error);
    });

  tiktokLiveConnection.on("gift", (message) => socket.emit("gift", message));
});

export default server;
