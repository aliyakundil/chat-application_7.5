import mongoose, { Schema, Document, Types } from "mongoose";

// Интерфейс для Mongoose-документа Message
export interface IMessage extends Document {
  sender: Types.ObjectId | string;   // ID отправителя
  room: Types.ObjectId | string;     // ID комнаты
  text: string;                      // текст сообщения
  edited: boolean;                   // было ли редактировано
  editedAt?: Date | null;            // дата редактирования
  readBy: (Types.ObjectId | string)[]; // кто прочитал
  createdAt: Date;                   // автоматически Mongoose
  updatedAt: Date;                   // автоматически Mongoose
}

// Схема
export const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    text: { type: String, required: true },
    edited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true } // создаёт createdAt и updatedAt
);

// Модель
export default mongoose.model<IMessage>("Message", messageSchema);