# Outlook Classifier Admin

Webapplicatie voor het monitoren van een of meer Outlook-mailboxen via Microsoft Graph. Beheerders kunnen credentials veilig opslaan, mailboxen koppelen, Outlook-categorieen beheren en classificatieregels configureren.

## Stack

- Next.js App Router
- PostgreSQL via raw SQL (`postgres`)
- AES-256-GCM versleuteling voor Microsoft client secrets
- Microsoft Graph client-credential flow
- API-prefix `/api/v1`

## Configuratie

```env
DATABASE_URL=postgres://user:password@db:5432/outlook_classifier
CREDENTIAL_ENCRYPTION_KEY=gebruik-een-lange-random-key-minimaal-24-tekens
ADMIN_SETUP_TOKEN=optionele-admin-api-token
```

Voer `db/migrations/001_initial.sql` uit op PostgreSQL voordat beheerdata wordt opgeslagen. De database hoort intern bereikbaar te zijn; expose PostgreSQL niet met een externe Docker port mapping.

## Development

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run build
```

Open daarna `http://localhost:3000`.

## Microsoft setup

Gebruik het scherm **Microsoft setup** om de redirect URI, admin-consent URL en manifest-permissions te genereren. De app verwacht application permissions voor `Mail.Read`, `Mail.ReadWrite` en `MailboxSettings.ReadWrite`.

### Automatisch app registration aanmaken

De setupsectie genereert een reviewbaar Microsoft Graph PowerShell-script. Dit script maakt de app registration, service principal, client secret en Graph application permission grants aan.

Veilige werkwijze:

1. Genereer de setup in de admin UI.
2. Controleer appnaam, redirect URI en permissies.
3. Voer het script uit als tenantbeheerder met voldoende Entra-rechten.
4. Bewaar de gegenereerde client secret direct in de credential vault; Microsoft toont die secret maar een keer.
5. Controleer in Microsoft Entra ID of de application permissions granted zijn.

Benodigde bootstrap-rechten:

- `Application.ReadWrite.All`
- `AppRoleAssignment.ReadWrite.All`

Benodigde Entra-rollen:

- Cloud Application Administrator of Application Administrator voor app registration beheer.
- Privileged Role Administrator voor programmatic tenant-wide admin consent.

Let op: programmatic admin consent heeft direct effect voor de tenant. Voer het script alleen uit na review en commit nooit terminaloutput met secrets.
