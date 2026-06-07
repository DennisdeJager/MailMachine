# MailMachine Architectuurrefactor - Security Review

Datum: 2026-06-07
Status: GO

## Bevindingen

- `mailmachine-web` ontvangt geen `DATABASE_URL` en geen `CREDENTIAL_ENCRYPTION_KEY`.
- `mailmachine-api` is de enige runtime met databasecredentials, migraties en directe PostgreSQL-toegang.
- PostgreSQL is uit de app-host compose verwijderd en verplaatst naar een aparte `compose.data.yaml` voor `local-data`.
- De lokale cross-host databaseverbinding gebruikt het interne data-host adres `192.168.10.50` en een configureerbare poort.

## Risico's

- De host-bound PostgreSQL-poort is alleen acceptabel als deze op het interne data-host adres gebonden blijft en firewall/routing niet publiek exposeert.
- Secrets moeten via environment/ALM worden gezet en mogen niet in Git terechtkomen.

## Advies

GO voor Development-output. Deployment moet controleren dat alleen `mailmachine-api` `DATABASE_URL` heeft en dat `mailmachine-postgres` niet publiek bereikbaar is.
