import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("De invoer is niet geldig. Controleer de gemarkeerde velden.", 422, error.flatten());
  }

  const message = error instanceof Error ? error.message : "De actie kon niet worden uitgevoerd.";
  return jsonError(message, 500);
}

export function requireAdmin(request: Request) {
  const configuredToken = process.env.ADMIN_SETUP_TOKEN;
  if (!configuredToken) return "local-admin";

  const token = request.headers.get("x-admin-token");
  if (token !== configuredToken) {
    throw new Error("Je sessie is verlopen of mist beheerrechten. Log opnieuw in om verder te gaan.");
  }

  return "admin";
}
