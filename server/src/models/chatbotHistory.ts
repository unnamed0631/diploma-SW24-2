import { HydratedDocument, Model, Schema, model } from "mongoose";

export type MessageRole = "system" | "user" | "model";

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface IChat {
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  addMessage: (role: MessageRole, content: string) => Promise<ChatDocument>;
}

export type ChatDocument = HydratedDocument<IChat>;

export interface ChatModel extends Model<IChat> {
  findOrCreate: (userId: string) => Promise<ChatDocument>;
}

const chatMessageSchema = new Schema<ChatMessage>(
  {
    role: {
      type: String,
      enum: ["system", "user", "model"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const chatSchema = new Schema<IChat>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    messages: [chatMessageSchema],
  },
  {
    timestamps: true,
  },
);

chatSchema.index({ userId: 1, createdAt: -1 });

chatSchema.methods.addMessage = async function (
  this: ChatDocument,
  role: MessageRole,
  content: string,
): Promise<ChatDocument> {
  this.messages.push({ role, content, timestamp: new Date() });
  this.updatedAt = new Date();
  return this.save();
};

chatSchema.statics.findOrCreate = async function (
  this: Model<IChat>,
  userId: string,
): Promise<ChatDocument> {
  let chat = await this.findOne({ userId });
  if (!chat) {
    chat = await this.create({
      userId,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
          timestamp: new Date(),
        },
      ],
    });
  }
  return chat;
};

const Chat = model<IChat, ChatModel>("ChatBotHistory", chatSchema);

export default Chat;
