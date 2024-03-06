const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5000/", "https://baghchal-beta.vercel.app/"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});
// Store room information
const rooms = {};

io.on("connection", (socket) => {
  // console.log("a user connected");

  socket.on("createRoom", async (gameInfo) => {
    if (rooms[gameInfo.roomNo]) {
      socket.emit("roomExists", gameInfo.roomNo);
    } else {
      // Create the room
      rooms[gameInfo.roomNo] = { sockets: {} };
      // Join the room
      socket.join(gameInfo.roomNo);
      // Add the user to the room
      rooms[gameInfo.roomNo].sockets[socket.id] = true;
      // Notify the user that the room is created
      io.to(gameInfo.roomNo).emit("created", {
        roomName: gameInfo.roomNo,
        status: 0,
        gameInfo: gameInfo,
        message: "Join sucessful",
      });
    }
  });

  // join room
  socket.on("joinRoom", (roomId) => {
    // Check if the room exists
    if (rooms[roomId]) {
      //check the numbers of user in room before joining
      let room = io.sockets.adapter.rooms.get(roomId);
      let numClients = room ? room.size : 0;
      // console.log("numClients--------", numClients);
      if (numClients < 1) {
        // Join the room
        socket.join(roomId);
        // Add the user to the room
        rooms[roomId].sockets[socket.id] = true;
        // Notify the user that they've joined the room
        socket.emit("joined", {
          roomName: roomId,
          status: 0,
          message: "Join sucessful",
        });
      } else {
        socket.emit("joined", {
          roomName: roomId,
          status: 1,
          message: "Room is full",
        });
      }
    } else {
      socket.emit("joined", {
        roomName: roomId,
        status: 1,
        message: "Room doesnt exist",
      });
    }
  });

  //send join confirmation to other player
  socket.on("anotherPlayerJoined", (data) => {
    // console.log("anotherPlayerJoined", data);
    //anotherPlayerJoinedConfirmation send to other user
    socket.broadcast
      .to(parseInt(data.roomName))
      .emit("anotherPlayerJoinedConfirmation", data);
  });

  socket.on("sendInitialBoardData", (data) => {
    // console.log("aba frontend ma send garni data", data);
    //board send to other user

    io.in(data.roomName).emit("initialBoard", data);
  });
  socket.on("sendMove", (data) => {
    console.log("sendMove", data);
    //send move to other user
    socket.broadcast.emit("move", data);
  });

  socket.on("surrender", (data) => {
    console.log("surrender", data);
    //send move to other user
    socket.broadcast.emit("surrenderConfirm", data);
  });
});

server.listen(3000, () => {
  console.log("SERVER RUNNING ");
});
