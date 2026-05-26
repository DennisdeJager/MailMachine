# Deployment Report - Outlook Classifier Admin

## Eindoordeel

Done - deployed naar DEV.

## Reden

De deployment-gate was initieel niet groen omdat de workspace geen Git repository was.

Feiten:

- `git status --short` faalt met: `fatal: not a git repository`.
- Er is geen Git remote.
- Er is geen commit SHA.
- Er is geen bekende GitHub Actions/ALM deploymentroute voor deze app.

Volgens de centrale SmawaGitOps deploymentregels moet een DEV-deployment via de bestaande GitHub/ALM route vanaf een commit verlopen. Een directe hotfix/deploy van een losse lokale map naar DEV is ongewenst en vereist expliciete uitzondering en doelinformatie.

## Wel aanwezig

- `work/outlook-classifier_REFINED.md`
- `work/test/outlook-classifier-testplan.md`
- `work/test/outlook-classifier-testreport.md`
- `work/outlook-classifier_DEPLOY.md`
- Build/test bewijs uit Development-output

## Nieuwe route

Gebruiker heeft `DennisdeJager/MailMachine` gekozen als doelrepo. Remote inspectie met `git ls-remote` gaf geen refs terug, dus de repo lijkt leeg.

## Uitgevoerd

- Repository geinitialiseerd en gepusht naar `DennisdeJager/MailMachine`.
- ALM app geregistreerd als `mailmachine`.
- GitHub provisioning uitgevoerd voor workflows, environments, secrets/variables en runner.
- DEV deployment uitgevoerd via ALM latest-to-dev flow.
- Remote healthcheck uitgevoerd.
- Remote smoke test op `/` uitgevoerd.

## Deploymentbewijs

- App ID: `mailmachine`
- Repo: `DennisdeJager/MailMachine`
- Branch: `main`
- Deployed commit: `31b81e717fb3ff411ef1882ec0012dad59852da5`
- Deployment plan: `plan-1779825704111`
- Execution: `exec-1779825862609`
- GitHub Actions run: `https://github.com/DennisdeJager/MailMachine/actions/runs/26472111286`
- Target: DEV `192.168.10.12`
- Web port: `31018`
- Container: `mailmachine-web`
- Container status: `Up`
- Healthcheck: `http://192.168.10.12:31018/api/health` -> HTTP 200, `{ ok: true, app: "MailMachine", status: "healthy" }`
- Smoke: `http://192.168.10.12:31018/` -> HTTP 200

## Afwijkingen

- Eerste deployment run faalde omdat de Dockerfile een ontbrekende `public/` directory kopieerde.
- Fix: `public/.gitkeep` toegevoegd en opnieuw gedeployed.
- Er is nog geen publiek domein/Caddy-route gekoppeld; de DEV app is bereikbaar via host/poort.

## Eindoordeel

GO - DEV deployment en health/smoke zijn groen.
