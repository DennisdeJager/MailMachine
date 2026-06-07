# Outlook Classifier Admin

Webapplicatie voor het monitoren van een of meer Outlook-mailboxen via Microsoft Graph. Beheerders kunnen credentials veilig opslaan, mailboxen koppelen, Outlook-categorieen beheren en classificatieregels configureren.

## Stack

- Next.js App Router
- `mailmachine-web` als stateless UI/runtime
- `mailmachine-api` als enige database-eigenaar met raw SQL (`postgres`)
- `mailmachine-postgres` op de lokale data-host
- AES-256-GCM versleuteling voor Microsoft client secrets
- Microsoft Graph client-credential flow
- API-prefix `/api/v1`

## Configuratie

```env
WEB_PORT=3000
APP_ENV=dev
API_BASE_URL=http://api:3001
POSTGRES_PASSWORD=gebruik-een-lange-random-database-wachtwoord
POSTGRES_PORT=55432
DATABASE_URL=postgres://mailmachine:<password>@192.168.10.50:55432/mailmachine
CREDENTIAL_ENCRYPTION_KEY=gebruik-een-lange-random-key-minimaal-24-tekens
ADMIN_SETUP_TOKEN=optionele-admin-api-token
```

De app-runtime op DEV (`192.168.10.12`) draait twee containers:

- `mailmachine-web`: UI, geen `DATABASE_URL`, proxyt `/api/*` naar `mailmachine-api`.
- `mailmachine-api`: API-contracten, migraties en databaseconnectie.

De data-runtime op `local-data` (`192.168.10.50`) draait `mailmachine-postgres` met eigen database, role en volume. Alleen `mailmachine-api` gebruikt `DATABASE_URL`.

## Lokale runtime

```bash
cp .env.example .env
docker compose up -d --build
```

Start op `local-data` (`192.168.10.50`) eerst de databasecontainer:

```bash
docker compose -f compose.data.yaml up -d
```

Start daarna op DEV (`192.168.10.12`) de app-containers:

```bash
docker compose up -d --build
```

Voor ALM/GitHub deployments moeten de repository/environment secrets `POSTGRES_PASSWORD`, `DATABASE_URL` en `CREDENTIAL_ENCRYPTION_KEY` aanwezig zijn. De deployment workflow schrijft deze waarden op de host naar `.env`, zonder secretwaarden naar Git te committen.

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
