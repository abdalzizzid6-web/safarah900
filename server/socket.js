import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Conditionally use Redis adapter if REDIS_URL is provided
  if (process.env.REDIS_URL) {
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Redis adapter enabled');
  } else {
    console.log('Running without Redis adapter (in-memory mode)');
  }

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Feature: Match Rooms
    socket.on('joinMatchRoom', (matchId) => {
       socket.join(`match_${matchId}`);
       console.log(`Socket ${socket.id} joined room match_${matchId}`);
    });

    socket.on('leaveMatchRoom', (matchId) => {
       socket.leave(`match_${matchId}`);
       console.log(`Socket ${socket.id} left room match_${matchId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
