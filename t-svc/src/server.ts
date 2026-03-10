import "dotenv/config";
import express from "express";
import env from "./config/env";
import routes from "./routes";
import ValidateRequest from "./config/validateRequest";
import App from "./config/app";
import { createServer } from "http";
import cors from "cors";
import os from "os";
import { Server } from "socket.io";



console.log("ENV CHECK:", {
  region: process.env.AWS_REGION,
  access: !!process.env.S3_ACCESS_KEY,
  secret: !!process.env.S3_SECRET_KEY,
  bucket: process.env.S3_BUCKET
});


function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}
const app = new App({
  port: env.PORT,
  middleWares: [
    // ⏱ Request timeout middleware
    (req: { method: any; originalUrl: any; }, res: { setTimeout: (arg0: number, arg1: () => void) => void; headersSent: any; status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error: string; }): void; new(): any; }; }; }, next: () => void) => {
      res.setTimeout(15_000, () => {
        console.error("⏱ Request timeout:", req.method, req.originalUrl);
        if (!res.headersSent) {
          res.status(504).json({ error: "Request timeout" });
        }
      });
      next();
    },

    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-role", "x-user-id"],
      credentials: true,
    }),

    express.urlencoded({ limit: "20mb", extended: false }),
    express.json({ limit: "50mb" }),

    ValidateRequest,
  ],
  routes: routes,
});

const httpServer = createServer(app.app);


const io = new Server(httpServer, {
  cors: {
    origin: "*",

    methods: ["GET", "POST"],
    
  },
  maxHttpBufferSize: 1e6, 
});



app.app.set("io", io);
console.log("Socket.io server not initialized",io);

app.app.set("io", io);

io.on("connection", (socket) => {
  console.log(`⚡ User connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});



// ✅ Start server


httpServer.listen(env.PORT, () => {
  const ip = getLocalIP();
  console.log(`🚀 Server running at:`);
  console.log(`- Local:   http://localhost:${env.PORT}/service`);
  console.log(`- Network: http://${ip}:${env.PORT}/service`);
});



