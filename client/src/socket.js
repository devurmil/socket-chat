import { io } from "socket.io-client";

const socket = io("http://localhost:1080", {
  transports: ["websocket"],
  withCredentials: true,
});

export default socket;
