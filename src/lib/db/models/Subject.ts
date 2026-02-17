import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISubject extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  startTime: string;
  endTime: string;
  activeDays: string[];
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime: { type: String, required: true }, // e.g. "10:30"
    activeDays: {
      type: [String],
      required: true,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    color: {
      type: String,
      default: "#805af2",
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

SubjectSchema.index({ userId: 1 });
SubjectSchema.index({ userId: 1, isActive: 1 });

const Subject: Model<ISubject> =
  mongoose.models.Subject || mongoose.model<ISubject>("Subject", SubjectSchema);

export default Subject;
