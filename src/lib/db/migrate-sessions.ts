/**
 * Migration script: Add sessionNumber support to AttendanceRecord and Subject slots.
 * Also sets maxSessionsPerDay on all users and drops the old unique index.
 *
 * Run with: npx tsx src/lib/db/migrate-sessions.ts
 *
 * This is idempotent — records/slots that already have sessionNumber are skipped.
 */

import * as dotenv from "dotenv";
import mongoose from "mongoose";
import { resolve } from "path";

// Load env from project root
dotenv.config({ path: resolve(__dirname, "../../../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not set in .env.local");
  process.exit(1);
}

async function migrate() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!);
  console.log("✅ Connected\n");

  const db = mongoose.connection.db!;

  // ── 1. Drop old unique index on attendancerecords ──────────────────
  const attendanceCol = db.collection("attendancerecords");
  try {
    const indexes = await attendanceCol.indexes();
    const oldIndex = indexes.find(
      (idx) =>
        idx.key &&
        idx.key.userId === 1 &&
        idx.key.subjectId === 1 &&
        idx.key.date === 1 &&
        !idx.key.sessionNumber
    );
    if (oldIndex && oldIndex.name) {
      await attendanceCol.dropIndex(oldIndex.name);
      console.log(`✅ Dropped old unique index: ${oldIndex.name}`);
    } else {
      console.log("ℹ️  Old unique index not found (already dropped or different)");
    }
  } catch (err: any) {
    console.log(`⚠️  Could not drop old index: ${err.message}`);
  }

  // ── 2. Backfill sessionNumber=1 on existing attendance records ─────
  const attendanceResult = await attendanceCol.updateMany(
    { sessionNumber: { $exists: false } },
    { $set: { sessionNumber: 1 } }
  );
  console.log(
    `✅ Backfilled sessionNumber=1 on ${attendanceResult.modifiedCount} attendance record(s)`
  );

  // ── 3. Create new unique index ────────────────────────────────────
  try {
    await attendanceCol.createIndex(
      { userId: 1, subjectId: 1, date: 1, sessionNumber: 1 },
      { unique: true }
    );
    console.log("✅ Created new unique index (userId, subjectId, date, sessionNumber)");
  } catch (err: any) {
    console.log(`⚠️  Index creation: ${err.message}`);
  }

  // ── 4. Backfill sessionNumber on subject schedule slots ────────────
  const subjectsCol = db.collection("subjects");
  const subjects = await subjectsCol.find({}).toArray();

  let slotsUpdated = 0;
  for (const subject of subjects) {
    if (!subject.schedules || !Array.isArray(subject.schedules)) continue;

    let changed = false;
    for (const schedule of subject.schedules) {
      if (!schedule.slots || !Array.isArray(schedule.slots)) continue;

      // Group slots by day to assign incrementing session numbers
      const dayCounters: Record<string, number> = {};
      for (const slot of schedule.slots) {
        if (slot.sessionNumber !== undefined && slot.sessionNumber !== null) continue;
        const day = slot.day;
        dayCounters[day] = (dayCounters[day] || 0) + 1;
        slot.sessionNumber = dayCounters[day];
        changed = true;
        slotsUpdated++;
      }
    }

    if (changed) {
      await subjectsCol.updateOne(
        { _id: subject._id },
        { $set: { schedules: subject.schedules } }
      );
    }
  }
  console.log(`✅ Backfilled sessionNumber on ${slotsUpdated} subject slot(s)`);

  // ── 5. Set maxSessionsPerDay on all users ──────────────────────────
  const usersCol = db.collection("users");
  const userResult = await usersCol.updateMany(
    { maxSessionsPerDay: { $exists: false } },
    { $set: { maxSessionsPerDay: 8 } }
  );
  console.log(
    `✅ Set maxSessionsPerDay=8 on ${userResult.modifiedCount} user(s)`
  );

  // ── Summary ────────────────────────────────────────────────────────
  console.log(`\n📊 Migration Summary:`);
  console.log(`   Attendance records backfilled: ${attendanceResult.modifiedCount}`);
  console.log(`   Subject slots backfilled:      ${slotsUpdated}`);
  console.log(`   Users updated:                 ${userResult.modifiedCount}`);

  await mongoose.disconnect();
  console.log("\n🔌 Disconnected. Migration complete!");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
