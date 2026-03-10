import { io } from "socket.io-client";

let baseUrl = import.meta.env.VITE_BACKEND_URL || "";
baseUrl = baseUrl.replace(/\/service\/?$/, "");


export const socket = io("https://service.tdrivers.in", {
  path: "/socket.io",
  transports: ["websocket"],
  secure: true,
});




// const socket = io(baseUrl, {
//   path: "/socket.io",        
//   transports: ["websocket"], 
//   reconnection: true,
//   reconnectionAttempts: 5,
//   reconnectionDelay: 1000,
// });

socket.on("connect", () => {
  console.log("🟢 Connected to socket server:", socket.id);
});

socket.on("disconnect", () => {
  console.log("🔴 Disconnected from socket server");
});
