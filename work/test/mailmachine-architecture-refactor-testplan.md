# MailMachine Architectuurrefactor - Testplan

Datum: 2026-06-07
Status: GO

## Functionele Scenario's

1. Controleer dat `GET /api/v1/dashboard` dashboarddata via de API-envelope teruggeeft.
2. Controleer dat `mailmachine-web` initiële dashboarddata via `API_BASE_URL` ophaalt.
3. Controleer dat clientacties op `/api/v1/*` via de webruntime naar de API-runtime kunnen worden geproxyd.
4. Controleer dat bestaande classifier-, crypto- en setup-bootstrap tests groen blijven.

## Negatieve Scenario's

1. Als `API_BASE_URL` ontbreekt, toont de webruntime een configuratiefout zonder databaseconnectie te openen.
2. Als de database niet bereikbaar is, rapporteert de API-dashboarddata `dbReady: false`.

## Security Checks

1. `compose.yaml` bevat geen PostgreSQL-service.
2. `mailmachine-web` bevat geen `DATABASE_URL`.
3. `mailmachine-api` bevat wel `DATABASE_URL` en voert migraties uit.
4. `compose.data.yaml` bevat `mailmachine-postgres` met eigen volume en role.

## Technische Checks

- `npm run typecheck`
- `npm test`
- `npm run build`

## Smoke Input Voor Deployment

1. Start op `local-data`: `docker compose -f compose.data.yaml up -d`.
2. Start op DEV: `docker compose up -d --build`.
3. Controleer `mailmachine-postgres` healthy.
4. Controleer `mailmachine-api` health op `/api/health`.
5. Controleer `mailmachine-web` op `http://192.168.10.12:${WEB_PORT:-3000}`.
