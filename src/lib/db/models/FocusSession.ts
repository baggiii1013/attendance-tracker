import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFocusSession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  duration: number; // minutes
  completed: boolean;
  completedAt?: Date;
  xpEarned: number;
}

const FocusSessionSchema = new Schema<IFocusSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject" },
    duration: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    xpEarned: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

FocusSessionSchema.index({ userId: 1 });
FocusSessionSchema.index({ userId: 1, completedAt: -1 });

const FocusSession: Model<IFocusSession> =
  mongoose.models.FocusSession ||
  mongoose.model<IFocusSession>("FocusSession", FocusSessionSchema);

export default FocusSession;
