import mongoose, { Document, Model, Schema } from "mongoose";

export type UserRole = "user" | "admin";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  image?: string;
  emailVerified?: Date;
  role: UserRole;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastAttendanceDate?: Date;
  totalAttendanceDays: number;
  totalScheduledDays: number;
  maxSessionsPerDay: number;
  isDisabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    emailVerified: { type: Date },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    xp: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastAttendanceDate: { type: Date },
    totalAttendanceDays: { type: Number, default: 0 },
    totalScheduledDays: { type: Number, default: 0 },
    maxSessionsPerDay: { type: Number, default: 8, min: 1, max: 15 },
    isDisabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexes for leaderboard queries
UserSchema.index({ xp: -1 });
UserSchema.index({ currentStreak: -1 });
UserSchema.index({ email: 1 }, { unique: true });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
