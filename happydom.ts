import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

// Redirect the db to an in-memory instance and neutralize the real
// RESEND_API_KEY that .env sets for local dev, so no test can write to the
// developer's sqlite file or send a real email through Resend.
process.env.DATABASE_PATH = ":memory:";
process.env.RESEND_API_KEY = "";

const { db } = await import("./src/db/client");
migrate(db, { migrationsFolder: "./src/db/migrations" });

GlobalRegistrator.register();