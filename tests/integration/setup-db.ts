import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { testSession } from "./session";

// Server actions call these Next.js APIs; they need a request context we don't have.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

// Replace Better Auth with a controllable session (see ./session.ts).
vi.mock("@/lib/auth/auth", () => ({
  getSession: vi.fn(async () => (testSession.user ? { user: testSession.user } : null)),
}));

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri("jobtracker-test");
});

afterEach(async () => {
  testSession.user = null;
  if (mongoose.connection.readyState === 1) {
    const collections = await mongoose.connection.db!.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  globalThis.mongoose = undefined;
  await mongo?.stop();
});
