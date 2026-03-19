import { Server, Socket } from "socket.io";
import Message from "../models/Message";
import Room from "../models/Room";

export function chatHandlers(io: Server, socket: Socket) {
  console.log("chatHandlers INIT"); 
  socket.on("join-room", async ({ roomId }) => {
    try {
      const room = await Room.findById(roomId);

      if (!room) {
        return socket.emit("error", { message: "Room not found" });
      }

      const isMember = room.members.map(m => m.toString()).includes(socket.data.userId);
      if (!isMember) {
        return socket.emit("error", { message: "Access denied" });
      }

      socket.join(roomId);
      io.to(roomId).emit("user-joined-room", {
        userId: socket.data.userId,
        username: socket.data.username,
      });
    } catch (err) {
      console.log("join-room error:", err);
    }
  });

  socket.on("leave-room", ({ roomId }) => {
    socket.leave(roomId);
    io.to(roomId).emit("user-left-room", {
      userId: socket.data.userId,
      username: socket.data.username,
    });
  });

  socket.on("send-message", async ({ roomId, content }) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) return socket.emit("error", { message: "Room not found" });

      const isMember = room.members.map(m => m.toString()).includes(socket.data.userId);
      if (!isMember) return socket.emit("error", { message: "Cannot send message" });

      const message = await Message.create({
        room: room._id.toString(),
        sender: socket.data.userId,
        text: content,
        edited: false,
        readBy: [socket.data.userId], 
      });

      room.lastActivity = new Date();
      await room.save();

      io.to(roomId).emit("new-message", {
        _id: message._id,
        room: room._id,
        sender: {
          userId: socket.data.userId,
          username: socket.data.username,
        },
        content: message.text,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.log("send-message error:", err);
    }
  });

  socket.on("typing", ({ roomId, isTyping }) => {
    socket.to(roomId).emit("user-typing", {
      userId: socket.data.userId,
      username: socket.data.username,
      isTyping,
    });
  });

  socket.on("message-read", async ({ messageId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      const hasRead = message.readBy.map(id => id.toString()).includes(socket.data.userId);
      if (!hasRead) {
        message.readBy.push(socket.data.userId);
        await message.save();
      }

      io.to(message.room.toString()).emit("message-read", {
        messageId: message._id,
        userId: socket.data.userId,
        readAt: new Date(),
      });
    } catch (err) {
      console.log("message-read error:", err);
    }
  });
}