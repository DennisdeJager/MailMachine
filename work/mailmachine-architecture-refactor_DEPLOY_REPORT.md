# MailMachine Architectuurrefactor - Deploymentrapport

Datum: 2026-06-07
Fase: Deployment
Status: NO-GO

## Deployed Commit

- Commit: `fe1e16d4de6ddb9ceb0a20e1396ef2d54b01bbf4`
- Branch/ref: `main`

## Targetomgeving

- DEV app-host: `capps-sg-dev` / `192.168.10.12`
- DEV data-host: `local-data` / `192.168.10.50`

## Deploymentresultaat

- GitHub Actions workflow: `Deploy Latest To Dev`
- Run: https://github.com/DennisdeJager/MailMachine/actions/runs/27091919052
- Resultaat: `failure`
- Job: `build-and-deploy-dev`
- Falende stap: `Deploy over LAN SSH`

## Bewijs

- Docker image/build stap: GO. Next.js productiebuild in de workflow compileerde succesvol.
- Deploy stap: NO-GO.
- Logregels uit de falende stap:
  - `Container mailmachine-api Started`
  - `Container mailmachine-api Waiting`
  - `Container mailmachine-api Error dependency api failed to start`
  - `dependency failed to start: container mailmachine-api is unhealthy`

## Healthcheckresultaat

NO-GO. `mailmachine-api` werd unhealthy tijdens de ALM deploy, waardoor `mailmachine-web` niet kon starten.

## Smoke-Testresultaat

Niet uitgevoerd. De deployment kwam niet voorbij de service health gate.

## Waarschijnlijke Oorzaak

De huidige ALM workflow deployt alleen de app-host compose en is nog niet volledig afgestemd op de nieuwe web/API/data-split:

- `mailmachine-postgres` werd op de app-host als orphan verwijderd, conform de nieuwe architectuur, maar de data-host deployment van `compose.data.yaml` werd niet door deze workflow uitgevoerd.
- De workflow-log meldde dat `POSTGRES_PASSWORD` en `CREDENTIAL_ENCRYPTION_KEY` tijdens compose-evaluatie niet gezet waren.
- De zichtbare ALM service-role configuratie bevat nog `web=frontend;postgres=database`, maar nog geen `api=backend`.

Directe SSH-verificatie vanaf deze Codex-sessie naar `capps@192.168.10.12` en `capps@192.168.10.50` faalde met `Permission denied (publickey,password)`. De self-hosted GitHub runner had wel deploy-SSH-toegang.

## Eindoordeel

NO-GO. Deployment is niet afgerond en MailMachine mag niet als Done worden gemarkeerd.

## Remediation Poging 2026-06-07

Na de eerste NO-GO is de `Deploy Latest To Dev` workflow aangepast zodat deze:

- `compose.data.yaml` naar `local-data` probeert te kopiëren;
- `/data/compose/mailmachine-postgres/.env` op de data-host schrijft zonder secretwaarden te loggen;
- `mailmachine-postgres` op `192.168.10.50` probeert te starten;
- daarna de app-host `.env` schrijft voor `mailmachine-web` en `mailmachine-api`.

Commit: `2bc6baef52b5644397b6d7f165c169efbe3c1f12`
Run: https://github.com/DennisdeJager/MailMachine/actions/runs/27092255015
Resultaat: `failure`

Nieuwe blocker:

- De self-hosted runner kan `192.168.10.50` bereiken en hostkeys ophalen.
- Login naar `DATA_DEPLOY_USER@192.168.10.50` faalt met `Permission denied (publickey,password)`.
- Daardoor wordt `mailmachine-postgres` niet op de data-host aangemaakt en kan de app-deploy niet doorgaan.

## Vereiste Correctie

Herstartfase: Development.

Minimaal nodig:

1. Geef de ALM deploy key toegang tot `local-data` of configureer `DATA_DEPLOY_USER` en `DATA_DEPLOY_SSH_KEY` voor de GitHub `dev` environment.
2. Controleer DEV environment/secrets voor `mailmachine-api`: `POSTGRES_PASSWORD`, `CREDENTIAL_ENCRYPTION_KEY` en optioneel `DATABASE_URL`.
3. ALM service roles bijwerken naar minimaal `web=frontend;api=backend`; Postgres hoort niet meer op de app-host.
4. Daarna opnieuw deployen naar DEV en remote health/smoke uitvoeren.
