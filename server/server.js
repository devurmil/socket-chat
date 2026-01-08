import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const users = {};
const userSocketMap = {};

const io = new Server(server, {
    cors: { 
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

app.get("/", (req, res) => {
  res.send("Socket server running");
});

io.on("connection", (socket) => {
    console.log("CONNECTED:", socket.id);

    socket.on("join", ({ username, room }) => {
        console.log("JOIN:", username, room);
        socket.username = username;
        socket.room = room;
        socket.join(room);

        userSocketMap[username] = socket.id;

        if (!users[room]) users[room] = [];
        users[room].push(username);

        io.to(room).emit("users", users[room]);
    
        socket.to(room).emit("message", {
            user: "System",
            text: `${username} has joined!`
        });
    });

    socket.on("sendMessage", (text) => {
        io.to(socket.room).emit("message", {
            user: socket.username,
            text,
        });
    });

    socket.on("typing", () => {
        socket.to(socket.room).emit("typing", socket.username);
    });

    socket.on("stopTyping", () => {
        socket.to(socket.room).emit("stopTyping");
    });

    socket.on("privateMessage", ({ to, text }) => {
        const targetSocketId = userSocketMap[to];

        if (targetSocketId) {
            io.to(targetSocketId).emit("privateMessage", {
                from: socket.username,
                text,
            });
        }
    });

    socket.on("disconnect", () => {
        const { room, username } = socket;

        if (username) {
            delete userSocketMap[username];
        }

        if (room && users[room]) {
            users[room] = users[room].filter(u => u !== username);
            io.to(room).emit("users", users[room]);
            io.to(room).emit("message", {
                user: "System",
                text: `${username} has left`,
            });
        }
    });
});

server.listen(1080, () => 
    console.log("Backend running on http://localhost:1080")
);