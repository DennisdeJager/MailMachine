import { buildAppRegistrationBootstrap, buildConsentUrl, buildGraphPermissionManifest } from "@/domain/graph";
import { jsonOk } from "@/lib/api";

export async function POST(request: Request) {
  const payload = (await request.json()) as { tenantId?: string; clientId?: string; redirectUri?: string; appName?: string };
  const tenantId = payload.tenantId || "common";
  const clientId = payload.clientId || "vul-client-id-in";
  const redirectUri = payload.redirectUri || `${new URL(request.url).origin}/api/v1/setup/callback`;
  const appName = payload.appName || "Outlook Classifier Admin";

  return jsonOk({
    redirectUri,
    consentUrl: buildConsentUrl({ tenantId, clientId, redirectUri, state: "outlook-classifier-admin" }),
    manifestPatch: buildGraphPermissionManifest(),
    bootstrap: buildAppRegistrationBootstrap({ appName, redirectUri, tenantId: payload.tenantId }),
    checklist: [
      "Review het gegenereerde PowerShell-script en de permissies.",
      "Voer het script uit als tenantbeheerder met de vereiste Entra-rollen.",
      "Bewaar Tenant ID, Client ID en Client secret direct in de credential vault.",
      "Controleer in Microsoft Entra ID of admin consent granted is.",
      "Voeg daarna een mailbox toe en start een gecontroleerde monitor-run."
    ]
  });
}
