import type { DashboardData } from "@/domain/types";

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const emptyDashboard = (message: string): DashboardData => ({
  credentials: [],
  mailboxes: [],
  categories: [],
  rules: [],
  audits: [],
  dbReady: false,
  dbError: message
});

export function getApiBaseUrl() {
  return process.env.API_BASE_URL?.replace(/\/$/, "");
}

export async function getDashboardDataFromApi(): Promise<DashboardData> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return emptyDashboard("API_BASE_URL ontbreekt. Configureer mailmachine-web om mailmachine-api te gebruiken.");
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/dashboard`, {
      cache: "no-store",
      headers: { accept: "application/json" }
    });
    const payload = (await response.json()) as ApiEnvelope<DashboardData>;

    if (!response.ok || !payload.ok || !payload.data) {
      return emptyDashboard(payload.error ?? "Mailmachine API gaf geen dashboarddata terug.");
    }

    return payload.data;
  } catch (error) {
    return emptyDashboard(error instanceof Error ? error.message : "Mailmachine API is niet bereikbaar.");
  }
}
