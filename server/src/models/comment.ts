import { Schema, model, Types } from "mongoose";

export interface IComment {
  _id: Types.ObjectId;
  content: string;
  likes: Types.ObjectId[];
  author: Types.ObjectId;
  blogId: Types.ObjectId;
  edited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
    },
    likes: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
      required: false,
    },
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    edited: {
      type: Boolean,
      required: false,
      default: false,
    },
    createdAt: {
      type: Date,
      required: false,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const Comment = model<IComment>("Comment", commentSchema);

export default Comment;
