# MailMachine Architectuurrefactor - Deploymentplan

Datum: 2026-06-07
Fase: Development
Status: Klaar voor Deployment

## Targetomgeving

- App-host DEV: `capps-sg-dev` / `192.168.10.12`
- Data-host DEV: `local-data` / `192.168.10.50`

## Benodigde Services

- `mailmachine-web` op DEV
- `mailmachine-api` op DEV
- `mailmachine-postgres` op `local-data`

## Migraties

`mailmachine-api` voert bij start `npm run db:migrate` uit. De webservice voert geen migraties uit.

## Environment En Secrets

Zonder secretwaarden vastleggen:

- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `CREDENTIAL_ENCRYPTION_KEY`
- optioneel `ADMIN_SETUP_TOKEN`
- optioneel `WEB_PORT`
- optioneel `POSTGRES_PORT`

## Deployvolgorde

1. Zet `.env` op `local-data` met `POSTGRES_PASSWORD` en eventueel `POSTGRES_PORT`.
2. Start op `local-data`: `docker compose -f compose.data.yaml up -d`.
3. Controleer `mailmachine-postgres` health.
4. Zet `.env` op DEV met `DATABASE_URL`, `CREDENTIAL_ENCRYPTION_KEY`, `API_BASE_URL=http://api:3001` en eventuele runtimewaarden.
5. Start op DEV: `docker compose up -d --build`.
6. Controleer `mailmachine-api` health.
7. Controleer `mailmachine-web` via browser of HTTP smoke.

## Healthcheck

- API: `http://127.0.0.1:3001/api/health` binnen de API-container of via service netwerk.
- Web: `http://192.168.10.12:${WEB_PORT:-3000}`.

## Rollback

1. Stop DEV app-containers: `docker compose down`.
2. Checkout vorige commit.
3. Start vorige app-compose opnieuw.
4. Laat `mailmachine-postgres` staan tenzij de rollback expliciet databaseherstel vereist.

## Risico's En Aandachtspunten

- Deployment moet bevestigen dat PostgreSQL niet publiek bereikbaar is.
- De API-service moet de data-host op `192.168.10.50:${POSTGRES_PORT:-55432}` kunnen bereiken.
- Geen Deployment uitgevoerd in deze fase.
