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
- De eerste remediation gebruikte ten onrechte een aparte `DATA_DEPLOY_USER`/`DATA_DEPLOY_SSH_KEY` route.
- Dit wijkt af van de normale ALM-afspraak. De workflow is daarna aangepast naar het bestaande VCCM-patroon: gebruik de reguliere ALM deploy key en resolveer de data-host user via de normale deploy-user en `root`.

## Remediation Correctie 2026-06-07

Commit: `2bc6bae` introduceerde een te specifieke data-host SSH-route. Die interpretatie was fout.

Correctie:

- Geen aparte data-host deploy key vereist.
- De workflow gebruikt nu de bestaande ALM deploy key.
- De workflow probeert op `local-data` de normale deploy-user en daarna `root`, net als het bewezen VCCM-patroon.
- Data-compose directory: `/data/compose/mailmachine-postgres`.
- Data-compose file: `compose.data.yaml`.

## Vereiste Correctie

Herstartfase: Development.

Minimaal nodig:

1. Nieuwe workflowcorrectie pushen.
2. Opnieuw via de normale ALM/GitHub route naar DEV deployen.
3. Controleer daarna `mailmachine-postgres` op `local-data`, `mailmachine-api` en `mailmachine-web` op DEV.
4. Remote health/smoke uitvoeren.

## Remediation Correctie 2 - 2026-06-07

Commit: `0b90bb20bee23d2412563037af60e3fa3098de01`
Run: https://github.com/DennisdeJager/MailMachine/actions/runs/27092442952
Resultaat: `failure`

Nieuwe bevinding:

- De reguliere ALM deploy key werkt voor de data-host via het VCCM-patroon.
- De workflow bereikte `local-data`, schreef de data-compose context en startte Docker Compose.
- De resterende blocker was geen toegangsprobleem maar een poortconflict: `192.168.10.50:55432` is al bezet.

Correctieve actie:

- MailMachine gebruikt voortaan de dedicated Postgres hostpoort `15433`.
- `compose.data.yaml`, app `DATABASE_URL` defaults, workflow defaults, `.env.example`, README en deploymentplan zijn daarop aangepast.

## Remediation Correctie 3 - 2026-06-07

Commit: `08be7d2a39af85523ebe4476de7a81c5bfc0c22d`
Run: https://github.com/DennisdeJager/MailMachine/actions/runs/27092591741
Resultaat: `failure`

Nieuwe bevinding:

- `mailmachine-postgres` werd op `local-data` succesvol gerecreated en gestart.
- Build van `mailmachine-web` en `mailmachine-api` slaagde.
- `mailmachine-api` bleef unhealthy tijdens de database healthcheck.

Correctieve actie:

- De workflow schrijft geen bestaande `DATABASE_URL` secret meer naar de app-host `.env`.
- De API gebruikt de compose-default `postgres://mailmachine:${POSTGRES_PASSWORD}@192.168.10.50:${POSTGRES_PORT:-15433}/mailmachine`, zodat stale secret-config de data-host split niet kan overrulen.

## Remediation Correctie 4 - 2026-06-07

Commit: `e1535854b54f5a950bd857b0b4ab0cd9257cf3a7`
Run: https://github.com/DennisdeJager/MailMachine/actions/runs/27092685934
Resultaat: `failure`

Nieuwe bevinding:

- `mailmachine-postgres` draait op de data-host.
- `mailmachine-api` start, maar faalt nog voor de health gate.
- De standaard workflow-log bevatte geen containerlogs, waardoor de oorzaak niet feitelijk zichtbaar was.

Correctieve actie:

- De ALM workflow dumpt bij een deploy-fout nu `docker ps` en tail-logs van `mailmachine-api`, `mailmachine-web` en `mailmachine-postgres`.
- Er worden geen `.env`-inhoud of secretwaarden gelogd.

## Remediation Correctie 5 - 2026-06-07

Commit: `0c6a3a7db4a73785e5164774ba27933fd38e0592`
Run: https://github.com/DennisdeJager/MailMachine/actions/runs/27092779714
Resultaat: `failure`

Nieuwe bevinding:

- Diagnostics tonen dat `mailmachine-postgres` healthy draait op `192.168.10.50:15433`.
- `mailmachine-api` restart door `TypeError: Invalid URL` bij het parsen van de database URL.
- Oorzaak: het Postgres-wachtwoord bevat URL-speciale tekens en moet als URL password-component ge-encoded worden.

Correctieve actie:

- De workflow schrijft opnieuw expliciet `DATABASE_URL`, maar nu gegenereerd uit de reguliere `POSTGRES_PASSWORD` secret met URL-encoding.
- De data-host `.env` blijft het raw wachtwoord gebruiken voor de Postgres container.

## Remediation Correctie 6 - 2026-06-07

Commit: `bb05f41e64de397b93e7dfb8dd51bea9e4b887c7`
Run: https://github.com/DennisdeJager/MailMachine/actions/runs/27092871535
Resultaat: `success`

Nieuwe bevinding:

- ALM deploy slaagde en `mailmachine-postgres`, `mailmachine-api` en `mailmachine-web` kwamen door de compose health gates.
- DEV smoke op `http://192.168.10.12:31018/` gaf `200 OK`.
- DEV smoke op `http://192.168.10.12:31018/api/health` gaf `503` vanaf de web-container omdat de build-time rewrite niet runtime naar `mailmachine-api` wees.

Correctieve actie:

- De build-time rewrite in `next.config.ts` is verwijderd.
- Runtime middleware proxy't `/api/*` alleen wanneer `APP_ROLE=web` naar `API_BASE_URL`.
- De API-container (`APP_ROLE=api`) handelt zijn eigen API routes direct af.
