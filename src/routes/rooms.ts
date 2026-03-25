import { Router } from "express";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import Room from "../models/Room.js";
import Message from "../models/Message.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).userId;

    const rooms = await Room.find({
      $or: [
        { isPublic: true },
        { members: userId }
      ]
    }).sort({ lastActivity: -1 }).exec();

    res.status(200).json(rooms)
  } catch (err: any) {
    res.status(500).json({ error: `Server error: ${err.message }` });
  }
});

// новый room
router.post('/', authenticateToken, async(req: Request, res: Response) => {
  try {
    const userId = (req.user as any).userId; 
    const { name, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Room name required" })
    }
    
    const room = new Room({
      name,
      isPublic: isPublic ?? false,
      members: [new mongoose.Types.ObjectId(userId)], 
      admins: [new mongoose.Types.ObjectId(userId)],
      lastActivity: new Date()
    });

    await room.save();
    console.log("Room created:", room);
    res.status(201).json(room);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
})


router.get("/:roomId/messages", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).userId;
    const { roomId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (!room.members.some(memberId => memberId.equals(userId))) {
      return res.status(403).json({ error: "Access denied" });
    }

    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: -1 }) 
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "username");

    res.json(messages.reverse());
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


export default router; 