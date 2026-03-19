import mongoose, { Schema, Document } from "mongoose";

export interface IRoom extends Document {
  name: string,
  members: mongoose.Types.ObjectId[],
  admins: mongoose.Types.ObjectId[],
  lastActivity: Date
};

export const roomSchema = new mongoose.Schema({
  name : {
    type: String,
    required: true,
    minlength: 3,
    trim: true,
    unique: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],
  admins: [{ 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

export default mongoose.model<IRoom>("Room", roomSchema);