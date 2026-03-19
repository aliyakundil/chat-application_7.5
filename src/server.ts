import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { Server, Socket } from "socket.io";
import { connectToDb } from "./config/database";
import fileDirName from "./utils/dirname";
import router from "./routes/rooms";
import authRouter from "./routes/auth";
import healthRouter from "./routes/health";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { chatHandlers } from "./socket/chatHandlers";
import { authenticateSocket } from "./socket/socketAuth"

// import { authenticateSocket } from "./middleware/socketAuth";


const app = express();
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(helmet());
app.use(cors());

const { __dirname, __filename } = fileDirName(import.meta.url);
const publickDirPath = path.join(__dirname, 'public');

app.use(express.static(publickDirPath));

// app.use('/rooms', express.static(path.join(__dirname, '..', 'rooms')));
app.use('/api/rooms', router);
app.use('/api', authRouter);
app.use('/api', healthRouter);


const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("No token"));
    }

    const user = await authenticateSocket(token);

    if (!user) {
      return next(new Error("Unauthorized"));
    }

    socket.data.userId = user._id.toString();
    socket.data.username = user.username;

    next();
  } catch (err) {
    next(new Error("Auth error"));
  }
});

// Подключаем обработчики
io.on("connection", (socket: Socket) => {
  console.log("User connected:", socket.id, socket.data.userId);

  chatHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

// Запуск сервера
async function startServer() {
  await connectToDb();
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();