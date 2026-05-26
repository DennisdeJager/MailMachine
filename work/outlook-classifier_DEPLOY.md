# Deployment Plan - Outlook Classifier Admin

## Targetomgeving

Nog niet gedeployed. Beoogd: ALM DEV via bestaande Smawa deploymentroute.

## Commit SHA

Nog niet beschikbaar in deze projectloze workspace.

## Migraties

- Voer `db/migrations/001_initial.sql` uit op PostgreSQL.
- PostgreSQL mag niet extern worden geexposed met `ports:`.

## Environment/secrets

- `DATABASE_URL`
- `CREDENTIAL_ENCRYPTION_KEY`
- Optioneel: `ADMIN_SETUP_TOKEN`
- Microsoft bootstrap-output: Tenant ID, Client ID en Client secret uit het setup-script. Secret direct opslaan in credential vault.

Secretwaarden niet in Git of rapportages opnemen.

## Build en deploy

```bash
npm install
npm test
npm run typecheck
npm run build
```

Daarna deploy via ALM DEV route.

## Healthcheck

- HTTP 200 op `/api/health`
- HTTP 200 op `/`
- API 200 op `POST /api/v1/setup`

## Smoke test

- Dashboard opent.
- Microsoft setup genereert redirect URI en admin-consent URL.
- In een geconfigureerde databaseomgeving: categorie, credential, mailbox en regel aanmaken.
- Handmatige monitor-run geeft gecontroleerd resultaat of duidelijke Graph-fout.

## Rollback

- Vorige applicatieversie terugzetten via ALM.
- Database migratie is additive; rollback vereist geen dataverlies zolang tabellen blijven staan.

## Risico's

- Microsoft Graph permissions vereisen tenant admin consent.
- Programmatic admin consent via het bootstrap-script heeft direct tenant-impact en moet door een bevoegde beheerder bewust worden uitgevoerd.
- Client secret rotatie moet operationeel geborgd worden.
- Scheduler/cron moet buiten de app de monitor-run periodiek triggeren.
