# Testplan - Outlook Classifier Admin

## Functionele scenario's

- Credential opslaan met tenant ID, client ID en client secret.
- Mailbox toevoegen met herkenbare naam en bestaand credential.
- Outlook-categorie toevoegen.
- Classificatieregel toevoegen met onderwerp/afzender/body/bijlage-condities.
- Handmatige monitor-run starten en resultaat tonen.

## Negatieve scenario's

- Ongeldige e-mail bij mailbox geeft validatiefout.
- Regel zonder condities wordt geweigerd.
- Ontbrekende `CREDENTIAL_ENCRYPTION_KEY` blokkeert credentialopslag.
- Graph-tokenfout geeft beheerbare Nederlandstalige fout.

## Edge cases

- Meerdere regels matchen hetzelfde bericht.
- Stop-processing regel voorkomt latere categorieen.
- Mailbox zonder berichten geeft processed 0.
- Database niet geconfigureerd toont setupmelding in UI.

## Security checks

- Secret staat versleuteld in database.
- Muterende API's controleren admin token wanneer `ADMIN_SETUP_TOKEN` is gezet.
- Auditlog schrijft mutaties weg.
- Geen secretwaarden in README, workdocs of responses.

## Regressiechecks

- `npm test`
- `npm run typecheck`
- `npm run build`

## Smoke test

- Start app.
- Open dashboard.
- Controleer dat database-configuratiemelding of beheerdata zichtbaar is.
- Genereer Microsoft setup.
- Maak categorie en regel aan in een database-geconfigureerde omgeving.
