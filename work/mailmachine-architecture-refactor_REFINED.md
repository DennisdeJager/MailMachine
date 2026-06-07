# MailMachine Architectuurrefactor - Refinement

Datum: 2026-06-07
Fase: Refinement
Status: GO

## User Story

Als beheerder wil ik dat MailMachine lokaal volgens de nieuwe RD Workx-architectuur draait, zodat de webruntime en API-runtime stateless op DEV staan en PostgreSQL als app-specifieke databasecontainer op de lokale data-host draait.

## Functionele Opdrachtanalyse

- Actor: MailMachine beheerder en deployment beheerder.
- Doel: app lokaal opsplitsen in `mailmachine-web`, `mailmachine-api` en `mailmachine-postgres`.
- Geraakte flows: dashboard laden, CRUD-acties via `/api/v1/*`, healthcheck, migraties bij API-start.
- Data/API-mutaties: blijven via bestaande API-contracten lopen; nieuwe dashboard-GET maakt initiële UI-data via API beschikbaar.
- Regressiegedrag: classificatie, credential-encryptie en setup-bootstrap blijven ongewijzigd.

## Scope

- `mailmachine-web` draait op DEV (`192.168.10.12`) zonder `DATABASE_URL`.
- `mailmachine-api` draait op DEV (`192.168.10.12`) als enige service met `DATABASE_URL`, migraties en PostgreSQL-toegang.
- `mailmachine-postgres` draait via aparte data-compose op `local-data` (`192.168.10.50`).
- De webruntime proxyt `/api/*` naar de API-runtime en laadt server-side dashboarddata via `API_BASE_URL`.
- Documentatie en env-voorbeeld beschrijven de gescheiden lokale runtime.

## Out Of Scope

- ALM DEV-deployment uitvoeren.
- Productie- of TEST-topologie wijzigen.
- Nieuwe functionele MailMachine-features toevoegen.

## Acceptatiecriteria

1. `compose.yaml` bevat `mailmachine-web` en `mailmachine-api`, zonder PostgreSQL-service.
2. `compose.data.yaml` bevat `mailmachine-postgres` met eigen database, role en volume op `/data/postgres/mailmachine/data`.
3. Alleen `mailmachine-api` krijgt `DATABASE_URL`; `mailmachine-web` krijgt `API_BASE_URL`.
4. De webpagina importeert geen database-repository meer voor initiële dashboarddata.
5. Er is een API-contract `GET /api/v1/dashboard` voor dashboarddata.
6. Typecheck, unit tests en productiebuild zijn groen.

## Architectuurimpact

Conform `04-architecture/data-storage.md`: PostgreSQL is app-specifiek, draait buiten de app-runtime op de data-host, en alleen de API-app heeft directe databasecredentials. De webruntime blijft stateless en gebruikt HTTP naar de API-app.

## Security-Impact

Security-impact van toepassing. De refactor verkleint secret-exposure doordat `DATABASE_URL` niet meer in `mailmachine-web` zit. `CREDENTIAL_ENCRYPTION_KEY` blijft alleen nodig op de API-service. De data-compose bindt PostgreSQL aan het interne data-host adres voor de lokale cross-host route.

## UX-Impact

Geen zichtbare UI-wijziging. De bestaande beheer-UI en flows blijven gelijk; alleen de dataroute verandert.

## Data/API-Impact

- Nieuw intern API-contract: `GET /api/v1/dashboard`.
- Bestaande CRUD-contracten blijven ongewijzigd.
- Migraties blijven in `db/migrations` en worden alleen door de API-service uitgevoerd.

## Dependency-Check

Geen blocking dependency gevonden. Deployment vereist wel dat `mailmachine-postgres` op `local-data` draait voordat `mailmachine-api` gezond kan worden.

## T-Shirt Size

M. De wijziging raakt runtime-architectuur, compose, SSR-dataflow en deploymentdocumentatie, maar herbouwt geen domeinlogica.

## Definition Of Ready

- [x] Scope concreet
- [x] Architectuurregel geladen
- [x] Security triage uitgevoerd
- [x] UX-impact beoordeeld
- [x] Testplan aanwezig
