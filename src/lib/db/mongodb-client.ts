/**
 * Re-exports getMongoClient from the unified Mongoose-based connection.
 *
 * Previously this file maintained its own native MongoClient pool, which meant
 * two independent connection pools hitting the same Atlas cluster — doubling
 * connection usage on every serverless instance.  Now both Mongoose queries and
 * the NextAuth MongoDBAdapter share a single pool managed by Mongoose.
 */
export { getMongoClient } from "./connection";

