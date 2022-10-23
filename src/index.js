import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { WebcastPushConnection } from "tiktok-live-connector";
import { TikTokConnectionWrapper } from "./connectionWrapper.js";
import { clientBlocked } from "./limiter.js";

const app = express();
const httpServer = createServer(app);

// Enable cross origin resource sharing
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  let tiktokConnectionWrapper;

  console.log("Connected", socket.id);
  console.info(
    "New connection from origin",
    socket.handshake.headers["origin"] || socket.handshake.headers["referer"]
  );

  socket.on("setUniqueId", (uniqueId, options) => {
    // Connect to the given username (uniqueId)
    try {
      tiktokConnectionWrapper = new TikTokConnectionWrapper(
        uniqueId,
        { processInitialData: true },
        true
      );
      tiktokConnectionWrapper.connect();
    } catch (err) {
      socket.emit("tiktokDisconnected", err.toString());
      return;
    }

    // Redirect wrapper control events once
    tiktokConnectionWrapper.once("connected", (state) =>
      socket.emit("tiktokConnected", state)
    );
    tiktokConnectionWrapper.once("disconnected", (reason) =>
      socket.emit("tiktokDisconnected", reason)
    );

    // Notify client when stream ends
    tiktokConnectionWrapper.connection.on("streamEnd", () =>
      socket.emit("streamEnd")
    );

    // Redirect message events
    tiktokConnectionWrapper.connection.on("roomUser", (msg) =>
      socket.emit("roomUser", msg)
    );
    tiktokConnectionWrapper.connection.on("member", (msg) =>
      socket.emit("member", msg)
    );
    tiktokConnectionWrapper.connection.on("chat", (msg) => {
      socket.emit("chat", msg);
    });
    tiktokConnectionWrapper.connection.on("gift", (msg) =>
      socket.emit("gift", msg)
    );
    tiktokConnectionWrapper.connection.on("social", (msg) =>
      socket.emit("social", msg)
    );
    tiktokConnectionWrapper.connection.on("like", (msg) =>
      socket.emit("like", msg)
    );
    tiktokConnectionWrapper.connection.on("questionNew", (msg) =>
      socket.emit("questionNew", msg)
    );
    tiktokConnectionWrapper.connection.on("linkMicBattle", (msg) =>
      socket.emit("linkMicBattle", msg)
    );
    tiktokConnectionWrapper.connection.on("linkMicArmies", (msg) =>
      socket.emit("linkMicArmies", msg)
    );
    tiktokConnectionWrapper.connection.on("liveIntro", (msg) =>
      socket.emit("liveIntro", msg)
    );
    tiktokConnectionWrapper.connection.on("emote", (msg) =>
      socket.emit("emote", msg)
    );
    tiktokConnectionWrapper.connection.on("envelope", (msg) =>
      socket.emit("envelope", msg)
    );
    tiktokConnectionWrapper.connection.on("subscribe", (msg) =>
      socket.emit("subscribe", msg)
    );
  });

  socket.on("disconnect", () => {
    if (tiktokConnectionWrapper) {
      tiktokConnectionWrapper.disconnect();
    }
  });

  socket.on("disconnectClient", () => {
    if (tiktokConnectionWrapper) {
      tiktokConnectionWrapper.disconnect();
      console.log("Disconnected!");
    }
  });
});

// Serve frontend files
app.use(express.static("public"));

// Start http listener
const port = process.env.PORT || 8081;
httpServer.listen(port);
console.info(`Server running! Please visit http://localhost:${port}`);
