import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import chatRouter from './routes/chat.js';
import http from 'http';
import { Server } from 'socket.io';
dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? "https://reading-community-7nysljzmy-kais-projects-d7c5b07e.vercel.app"
    : "http://localhost:3000"
}));

app.use(express.json());
mongoose.connect(process.env.MONGODB_URL!)
.then(() => console.log('mongoose接続完了'))
.catch(err =>console.error('mongoose接続エラー', err));

const PORT = process.env.PORT || 5003;

const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? "https://reading-community-klo5zpwop-kais-projects-d7c5b07e.vercel.app"
        : "http://localhost:3000"
    }
  });

app.use('/api/channels', chatRouter(io as Server));

io.on("connection", (socket) => {
    console.log("クライアント接続しました")
    socket.on("disconnect", () => {
    console.log("クライアントと接続が切れました")
    });
});

server.listen(PORT, () => {
console.log(`Server is running on port ${PORT}`);
});