import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    await db`SELECT 1`;
  } catch (error) {
    return NextResponse.json({
      ok: false,
      app: "MailMachine",
      status: "unhealthy",
      database: "unavailable",
      error: error instanceof Error ? error.message : "Database is niet bereikbaar."
    }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    app: "MailMachine",
    status: "healthy",
    database: "available"
  });
}
