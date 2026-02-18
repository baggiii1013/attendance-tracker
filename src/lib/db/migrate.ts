/**
 * Migration script: Convert Subject documents from flat schedule fields
 * (startTime, endTime, activeDays) to the new schedules[] array format.
 *
 * Run with: npx tsx src/lib/db/migrate.ts
 * Or:       npx ts-node --esm src/lib/db/migrate.ts
 *
 * This is idempotent — subjects that already have schedules[] are skipped.
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
  const subjectsCol = db.collection("subjects");

  // Find subjects that have the old flat fields and no schedules array
  const oldSubjects = await subjectsCol
    .find({
      $or: [
        { schedules: { $exists: false } },
        { schedules: { $size: 0 } },
      ],
      activeDays: { $exists: true },
    })
    .toArray();

  console.log(`📋 Found ${oldSubjects.length} subject(s) to migrate\n`);

  let migrated = 0;
  let skipped = 0;

  for (const subject of oldSubjects) {
    const { _id, activeDays, startTime, endTime, name } = subject;

    if (!activeDays || !Array.isArray(activeDays) || activeDays.length === 0) {
      console.log(`  ⏭️  Skipping "${name}" (_id: ${_id}) — no activeDays`);
      skipped++;
      continue;
    }

    // Build slots from the flat fields
    const slots = activeDays.map((day: string) => ({
      day,
      startTime: startTime || "09:00",
      endTime: endTime || "10:00",
    }));

    const scheduleEntry = {
      slots,
      effectiveFrom: subject.createdAt || new Date(),
      effectiveTo: null,
    };

    await subjectsCol.updateOne(
      { _id },
      {
        $set: { schedules: [scheduleEntry] },
        $unset: { activeDays: "", startTime: "", endTime: "" },
      }
    );

    console.log(`  ✅ Migrated "${name}" (${activeDays.length} slots)`);
    migrated++;
  }

  // Also add role field to users that don't have it
  const usersCol = db.collection("users");
  const usersWithoutRole = await usersCol.countDocuments({
    role: { $exists: false },
  });

  if (usersWithoutRole > 0) {
    await usersCol.updateMany(
      { role: { $exists: false } },
      { $set: { role: "user", isDisabled: false } }
    );
    console.log(`\n✅ Added role="user" to ${usersWithoutRole} user(s)`);
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   Subjects migrated: ${migrated}`);
  console.log(`   Subjects skipped:  ${skipped}`);
  console.log(`   Users updated:     ${usersWithoutRole}`);

  await mongoose.disconnect();
  console.log("\n🔌 Disconnected. Migration complete!");
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
