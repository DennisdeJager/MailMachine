# Deployment Plan - Outlook Classifier Admin

## Targetomgeving

Nog niet gedeployed. Beoogd: ALM DEV via bestaande Smawa deploymentroute.

## Commit SHA

Nog niet beschikbaar in deze projectloze workspace.

## Migraties

- PostgreSQL draait als interne `postgres` service in `compose.yaml`.
- De webcontainer voert `npm run db:migrate` uit bij start.
- De migratierunner registreert toegepaste bestanden in `schema_migrations`.
- `db/migrations/001_initial.sql` wordt idempotent toegepast.
- PostgreSQL mag niet extern worden geexposed met `ports:`.

## Environment/secrets

- `POSTGRES_PASSWORD`
- `CREDENTIAL_ENCRYPTION_KEY`
- Optioneel: `ADMIN_SETUP_TOKEN`
- Microsoft bootstrap-output: Tenant ID, Client ID en Client secret uit het setup-script. Secret direct opslaan in credential vault.

Secretwaarden niet in Git of rapportages opnemen.

Status 2026-05-26: `POSTGRES_PASSWORD` en `CREDENTIAL_ENCRYPTION_KEY` zijn als GitHub repository secrets ingesteld. De ALM app-registratie bevat nu `web` + interne `postgres` service en de PostgreSQL dependency.

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
- Microsoft setup toont de flow in tabs: overzicht, rechten, uitvoeren, opslaan en controleren.
- In een geconfigureerde databaseomgeving: categorie, credential, mailbox en regel aanmaken.
- Handmatige monitor-run geeft gecontroleerd resultaat of duidelijke Graph-fout.

## Rollback

- Vorige applicatieversie terugzetten via ALM.
- Database migratie is additive; rollback vereist geen dataverlies zolang tabellen en het Docker volume blijven staan.

## Risico's

- Microsoft Graph permissions vereisen tenant admin consent.
- Programmatic admin consent via het bootstrap-script heeft direct tenant-impact en moet door een bevoegde beheerder bewust worden uitgevoerd.
- Client secret rotatie moet operationeel geborgd worden.
- Scheduler/cron moet buiten de app de monitor-run periodiek triggeren.
