/**
 * Starts a throwaway MongoDB replica set and a Next.js dev server pointed at it.
 * Used by Playwright's webServer; never touches the database in .env.local.
 */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { MongoMemoryReplSet } from "mongodb-memory-server";

const PORT = process.env.E2E_PORT ?? "3100";
const BASE = `http://localhost:${PORT}`;

async function main() {
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongo.getUri("jobtracker-e2e");

  const next = spawn("npx", ["next", "dev", "--port", PORT], {
    stdio: "inherit",
    env: {
      ...process.env,
      // Real env vars win over .env.local in Next.js.
      MONGODB_URI: uri,
      // A fresh throwaway secret per run; nothing real is ever signed with it.
      BETTER_AUTH_SECRET: randomBytes(32).toString("base64"),
      BETTER_AUTH_URL: BASE,
      NEXT_PUBLIC_BETTER_AUTH_URL: BASE,
      NEXT_PUBLIC_SITE_URL: BASE,
      NEXT_DIST_DIR: ".next-e2e",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });

  const stop = async () => {
    next.kill("SIGTERM");
    await mongo.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  next.on("exit", async (code) => {
    await mongo.stop();
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
