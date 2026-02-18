import mongoose, { Document, Model, Schema } from "mongoose";

export interface IScheduleSlot {
  day: string;
  sessionNumber: number;
  startTime?: string;
  endTime?: string;
}

export interface IScheduleEntry {
  slots: IScheduleSlot[];
  effectiveFrom: Date;
  effectiveTo: Date | null; // null = currently active
}

export interface ISubject extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  schedules: IScheduleEntry[];
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals (from current schedule)
  activeDays: string[];
  startTime: string;
  endTime: string;
}

const ScheduleSlotSchema = new Schema<IScheduleSlot>(
  {
    day: {
      type: String,
      required: true,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    sessionNumber: { type: Number, required: true, min: 1 },
    startTime: { type: String },
    endTime: { type: String },
  },
  { _id: false }
);

const ScheduleEntrySchema = new Schema<IScheduleEntry>(
  {
    slots: { type: [ScheduleSlotSchema], required: true },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date, default: null },
  },
  { _id: true }
);

const SubjectSchema = new Schema<ISubject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    schedules: { type: [ScheduleEntrySchema], default: [] },
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

// Helper: get the schedule effective on a given date
export function getScheduleForDate(
  schedules: IScheduleEntry[],
  date: Date
): IScheduleEntry | null {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return (
    schedules.find((s) => {
      const from = new Date(s.effectiveFrom);
      from.setHours(0, 0, 0, 0);
      if (checkDate < from) return false;
      if (s.effectiveTo === null) return true;
      const to = new Date(s.effectiveTo);
      to.setHours(23, 59, 59, 999);
      return checkDate <= to;
    }) || null
  );
}

// Helper: get activeDays from current schedule (backward compat virtual)
SubjectSchema.virtual("activeDays").get(function () {
  const current = (this.schedules || []).find(
    (s: IScheduleEntry) => s.effectiveTo === null
  );
  if (!current) return [];
  return [...new Set(current.slots.map((slot: IScheduleSlot) => slot.day))];
});

SubjectSchema.virtual("startTime").get(function () {
  const current = (this.schedules || []).find(
    (s: IScheduleEntry) => s.effectiveTo === null
  );
  if (!current || current.slots.length === 0) return "";
  return current.slots[0].startTime;
});

SubjectSchema.virtual("endTime").get(function () {
  const current = (this.schedules || []).find(
    (s: IScheduleEntry) => s.effectiveTo === null
  );
  if (!current || current.slots.length === 0) return "";
  return current.slots[0].endTime;
});

SubjectSchema.set("toJSON", { virtuals: true });
SubjectSchema.set("toObject", { virtuals: true });

// Delete old model cache on HMR to avoid schema conflicts
if (mongoose.models.Subject) {
  delete mongoose.models.Subject;
}

const Subject: Model<ISubject> = mongoose.model<ISubject>(
  "Subject",
  SubjectSchema
);

export default Subject;
