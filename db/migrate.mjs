import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL ontbreekt. Kan PostgreSQL migraties niet uitvoeren.");
}

const migrationsDir = path.join(process.cwd(), "db", "migrations");
const sql = postgres(databaseUrl, {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 20
});

try {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const [existing] = await sql`SELECT filename FROM schema_migrations WHERE filename = ${file}`;
    if (existing) {
      console.log(`Migration already applied: ${file}`);
      continue;
    }

    const statement = await readFile(path.join(migrationsDir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(statement);
      await tx`INSERT INTO schema_migrations (filename) VALUES (${file})`;
    });
    console.log(`Migration applied: ${file}`);
  }
} finally {
  await sql.end({ timeout: 5 });
}
