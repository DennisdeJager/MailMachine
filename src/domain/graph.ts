import { decryptSecret } from "@/lib/crypto";
import type { Credential, MessageForClassification } from "./types";

type StoredCredential = Credential & { encryptedClientSecret: string };

export function buildConsentUrl(input: {
  tenantId: string;
  clientId: string;
  redirectUri: string;
  state: string;
}) {
  const url = new URL(`https://login.microsoftonline.com/${input.tenantId}/adminconsent`);
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("state", input.state);
  return url.toString();
}

export function buildGraphPermissionManifest() {
  return {
    requiredResourceAccess: [
      {
        resourceAppId: "00000003-0000-0000-c000-000000000000",
        resourceAccess: [
          { id: "810c84a8-4a9e-49e6-bf7d-12d183f40d01", type: "Role", name: "Mail.Read" },
          { id: "6931bccd-447a-43d1-b442-00a195474933", type: "Role", name: "MailboxSettings.ReadWrite" },
          { id: "e2a3a72e-5f79-4c64-b1b1-878b674786c9", type: "Role", name: "Mail.ReadWrite" }
        ]
      }
    ]
  };
}

export function buildAppRegistrationBootstrap(input: {
  appName: string;
  redirectUri: string;
  tenantId?: string;
}) {
  const appName = input.appName.trim() || "Outlook Classifier Admin";
  const tenantId = input.tenantId?.trim() || "<tenant-id>";
  const manifest = buildGraphPermissionManifest();
  const permissionNames = manifest.requiredResourceAccess[0].resourceAccess.map((permission) => permission.name);

  const powershellScript = [
    "# Outlook Classifier Admin - Microsoft Entra bootstrap",
    "# Doel: app registration, service principal, client secret en Graph application permissions aanmaken.",
    "# Vereist: Microsoft.Graph PowerShell module en een account met voldoende Entra rechten.",
    "# Let op: admin consent werkt direct na uitvoeren. Review dit script voordat je het draait.",
    "",
    "$ErrorActionPreference = \"Stop\"",
    `$TenantId = "${tenantId}"`,
    `$AppName = "${appName.replaceAll("\"", "`\"")}"`,
    `$RedirectUri = "${input.redirectUri.replaceAll("\"", "`\"")}"`,
    "$RequiredGraphAppRoles = @(",
    ...permissionNames.map((name) => `  "${name}"`),
    ")",
    "",
    "Install-Module Microsoft.Graph -Scope CurrentUser -Force",
    "Import-Module Microsoft.Graph.Applications",
    "Import-Module Microsoft.Graph.Authentication",
    "",
    "Connect-MgGraph -TenantId $TenantId -Scopes \"Application.ReadWrite.All\", \"AppRoleAssignment.ReadWrite.All\"",
    "",
    "$GraphSp = Get-MgServicePrincipal -Filter \"appId eq '00000003-0000-0000-c000-000000000000'\" -Property Id,AppRoles,DisplayName",
    "if (-not $GraphSp) { throw \"Microsoft Graph service principal is niet gevonden in deze tenant.\" }",
    "",
    "$RequiredResourceAccess = @(",
    "  @{",
    "    ResourceAppId = \"00000003-0000-0000-c000-000000000000\"",
    "    ResourceAccess = @(",
    ...manifest.requiredResourceAccess[0].resourceAccess.map((permission) => `      @{ Id = [Guid]"${permission.id}"; Type = "${permission.type}" }`),
    "    )",
    "  }",
    ")",
    "",
    "$Application = New-MgApplication -DisplayName $AppName -SignInAudience \"AzureADMyOrg\" -Web @{ RedirectUris = @($RedirectUri) } -RequiredResourceAccess $RequiredResourceAccess",
    "$ServicePrincipal = New-MgServicePrincipal -AppId $Application.AppId",
    "",
    "$Password = Add-MgApplicationPassword -ApplicationId $Application.Id -PasswordCredential @{ DisplayName = \"Outlook Classifier Admin secret\" }",
    "",
    "foreach ($RoleValue in $RequiredGraphAppRoles) {",
    "  $Role = $GraphSp.AppRoles | Where-Object { $_.Value -eq $RoleValue -and $_.AllowedMemberTypes -contains \"Application\" } | Select-Object -First 1",
    "  if (-not $Role) { throw \"Graph application permission niet gevonden: $RoleValue\" }",
    "  New-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $ServicePrincipal.Id -PrincipalId $ServicePrincipal.Id -ResourceId $GraphSp.Id -AppRoleId $Role.Id | Out-Null",
    "}",
    "",
    "Write-Host \"\"",
    "Write-Host \"Aangemaakt. Bewaar de client secret direct in de credential vault; deze wordt maar een keer getoond.\" -ForegroundColor Yellow",
    "Write-Host \"Tenant ID: $TenantId\"",
    "Write-Host \"Client ID: $($Application.AppId)\"",
    "Write-Host \"Client secret: $($Password.SecretText)\"",
    "Write-Host \"Object ID application: $($Application.Id)\"",
    "Write-Host \"Object ID service principal: $($ServicePrincipal.Id)\"",
    "Disconnect-MgGraph"
  ].join("\n");

  return {
    recommendedMode: "Script eerst reviewen, daarna uitvoeren als tenantbeheerder.",
    requiredAdminRoles: [
      "Cloud Application Administrator of Application Administrator voor app registration beheer.",
      "Privileged Role Administrator voor programmatic tenant-wide admin consent op application permissions."
    ],
    requiredScopes: ["Application.ReadWrite.All", "AppRoleAssignment.ReadWrite.All"],
    permissions: permissionNames,
    securityWarnings: [
      "Programmatic admin consent heeft direct effect voor de tenant.",
      "De client secret wordt door Microsoft maar een keer getoond.",
      "Beperk toegang operationeel tot de mailboxen die echt gemonitord moeten worden.",
      "Voer het script alleen uit vanaf een beheerwerkstation en commit geen output met secrets."
    ],
    instructions: [
      "Open PowerShell als de tenantbeheerder die consent mag verlenen.",
      "Plak het script in een leeg bestand, bijvoorbeeld create-outlook-classifier-app.ps1.",
      "Lees de appnaam, redirect URI en permissies na voordat je het script uitvoert.",
      "Voer het script uit en log in wanneer Microsoft Graph daarom vraagt.",
      "Kopieer Tenant ID, Client ID en Client secret direct naar de credential vault in deze app.",
      "Test daarna de credential met een mailbox die expliciet voor monitoring bedoeld is."
    ],
    postRunChecks: [
      "Controleer in Entra ID > App registrations dat de app bestaat.",
      "Controleer bij API permissions dat Mail.Read, Mail.ReadWrite en MailboxSettings.ReadWrite granted zijn.",
      "Controleer in Enterprise applications dat de service principal bestaat.",
      "Registreer de secret-rotatiedatum in beheer."
    ],
    powershellScript
  };
}

export async function getClientCredentialToken(credential: StoredCredential) {
  const body = new URLSearchParams({
    client_id: credential.clientId,
    client_secret: decryptSecret(credential.encryptedClientSecret),
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials"
  });

  const response = await fetch(`${credential.authorityHost}/${credential.tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error("Microsoft OAuth-token ophalen is mislukt. Controleer tenant, appregistratie en client secret.");
  }

  const payload = (await response.json()) as { access_token: string };
  return payload.access_token;
}

export async function fetchRecentMessages(input: {
  credential: StoredCredential;
  mailboxAddress: string;
  folder: string;
  limit?: number;
}): Promise<MessageForClassification[]> {
  const token = await getClientCredentialToken(input.credential);
  const url = new URL(`${input.credential.graphBaseUrl}/users/${encodeURIComponent(input.mailboxAddress)}/mailFolders/${encodeURIComponent(input.folder)}/messages`);
  url.searchParams.set("$top", String(input.limit ?? 25));
  url.searchParams.set("$select", "id,subject,bodyPreview,from,hasAttachments,internetMessageId,categories");
  url.searchParams.set("$orderby", "receivedDateTime desc");

  const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) {
    throw new Error(`Berichten ophalen is mislukt voor ${input.mailboxAddress}. Controleer Graph-rechten en mailbox-toegang.`);
  }

  const payload = (await response.json()) as { value: Array<Record<string, unknown>> };
  return payload.value.map((item) => ({
    id: String(item.id ?? ""),
    subject: String(item.subject ?? ""),
    bodyPreview: String(item.bodyPreview ?? ""),
    sender: String(((item.from as { emailAddress?: { address?: string } } | undefined)?.emailAddress?.address) ?? ""),
    hasAttachments: Boolean(item.hasAttachments),
    internetMessageId: String(item.internetMessageId ?? "")
  }));
}

export async function applyOutlookCategories(input: {
  credential: StoredCredential;
  mailboxAddress: string;
  messageId: string;
  categories: string[];
}) {
  const token = await getClientCredentialToken(input.credential);
  const response = await fetch(`${input.credential.graphBaseUrl}/users/${encodeURIComponent(input.mailboxAddress)}/messages/${encodeURIComponent(input.messageId)}`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ categories: input.categories })
  });

  if (!response.ok) {
    throw new Error("Outlook-categorie toepassen is mislukt. Controleer Mail.ReadWrite en category-namen.");
  }
}
