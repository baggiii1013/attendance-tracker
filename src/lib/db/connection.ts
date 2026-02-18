import { MongoClient } from "mongodb";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connects to MongoDB via Mongoose with serverless-optimized settings.
 *
 * Pool tuning rationale (Vercel serverless):
 *  - Each function instance handles 1 concurrent request, so a large pool is wasteful.
 *  - maxPoolSize: 5  — generous for a single-request instance; prevents exhausting
 *    Atlas's connection limit when many cold instances spin up.
 *  - minPoolSize: 1  — keeps one socket warm to avoid re-handshake on warm invocations.
 *  - maxIdleTimeMS: 30 000 — close idle sockets after 30 s (serverless instances
 *    are short-lived anyway).
 *  - serverSelectionTimeoutMS: 5 000 — fail fast if Atlas is unreachable instead of
 *    the default 30 s hang.
 *  - socketTimeoutMS: 45 000 — generous per-operation timeout.
 *  - autoIndex: false — indexes should be managed explicitly via migration scripts
 *    or the Atlas UI, not rebuilt on every cold start.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 5,
      minPoolSize: 1,
      maxIdleTimeMS: 30_000,
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS: 45_000,
      autoIndex: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Returns the underlying native MongoClient managed by Mongoose.
 * This lets the NextAuth MongoDBAdapter share the *same* connection pool
 * instead of opening a second, independent pool to the same Atlas cluster.
 */
export async function getMongoClient(): Promise<MongoClient> {
  const conn = await connectDB();
  // Mongoose bundles its own copy of the mongodb driver whose MongoClient type
  // is structurally identical but nominally different from the top-level mongodb
  // package.  The double-cast via `unknown` bridges the two declarations safely.
  return conn.connection.getClient() as unknown as MongoClient;
}
