import postgres from "postgres";

let sql: postgres.Sql | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL ontbreekt. Configureer PostgreSQL voordat beheerdata wordt opgeslagen.");
  }

  if (!sql) {
    sql = postgres(process.env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10
    });
  }

  return sql;
}

export type Sql = ReturnType<typeof getDb>;
