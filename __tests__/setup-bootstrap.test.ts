import { describe, expect, it } from "vitest";
import { buildAppRegistrationBootstrap } from "@/domain/graph";

describe("buildAppRegistrationBootstrap", () => {
  it("generates a reviewable Microsoft Graph PowerShell script", () => {
    const guide = buildAppRegistrationBootstrap({
      appName: "Outlook Classifier Admin",
      redirectUri: "https://example.test/api/v1/setup/callback",
      tenantId: "tenant-123"
    });

    expect(guide.requiredScopes).toContain("Application.ReadWrite.All");
    expect(guide.requiredScopes).toContain("AppRoleAssignment.ReadWrite.All");
    expect(guide.permissions).toEqual(["Mail.Read", "MailboxSettings.ReadWrite", "Mail.ReadWrite"]);
    expect(guide.powershellScript).toContain("New-MgApplication");
    expect(guide.powershellScript).toContain("Add-MgApplicationPassword");
    expect(guide.powershellScript).toContain("New-MgServicePrincipalAppRoleAssignment");
    expect(guide.powershellScript).not.toContain("client-secret-value");
  });
});
