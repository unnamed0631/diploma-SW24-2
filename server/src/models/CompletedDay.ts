import mongoose, { Schema, Types } from "mongoose";

export interface ICompletedDay {
  userId: Types.ObjectId;
  date: Date;
  createdAt: Date;
}

const CompletedDaySchema = new Schema<ICompletedDay>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

CompletedDaySchema.index({ userId: 1, date: 1 }, { unique: true });

const CompletedDay = mongoose.model("CompletedDay", CompletedDaySchema);

export default CompletedDay;
