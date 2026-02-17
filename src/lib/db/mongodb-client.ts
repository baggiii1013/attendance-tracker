import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

interface MongoClientCache {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: MongoClientCache | undefined;
}

const cached: MongoClientCache = global._mongoClientPromise ?? {
  client: null,
  promise: null,
};

if (!global._mongoClientPromise) {
  global._mongoClientPromise = cached;
}

export function getMongoClient(): Promise<MongoClient> {
  if (cached.client) {
    return Promise.resolve(cached.client);
  }

  if (!cached.promise) {
    const client = new MongoClient(MONGODB_URI);
    cached.promise = client.connect().then((c) => {
      cached.client = c;
      return c;
    });
  }

  return cached.promise;
}

export default getMongoClient;
