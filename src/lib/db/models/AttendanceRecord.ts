import mongoose, { Document, Model, Schema } from "mongoose";

export type AttendanceStatus = "present" | "absent" | "late";

export interface IAttendanceRecord extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  markedAt: Date;
  xpEarned: number;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      required: true,
    },
    markedAt: { type: Date, default: Date.now },
    xpEarned: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance records for the same subject on the same day
AttendanceRecordSchema.index(
  { userId: 1, subjectId: 1, date: 1 },
  { unique: true }
);
AttendanceRecordSchema.index({ userId: 1, date: 1 });

const AttendanceRecord: Model<IAttendanceRecord> =
  mongoose.models.AttendanceRecord ||
  mongoose.model<IAttendanceRecord>("AttendanceRecord", AttendanceRecordSchema);

export default AttendanceRecord;
