import { jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return jsonOk({
    adminConsent: url.searchParams.get("admin_consent"),
    tenant: url.searchParams.get("tenant"),
    state: url.searchParams.get("state"),
    message: "Microsoft heeft de consent callback afgerond. Controleer daarna de credential in Beheer."
  });
}
