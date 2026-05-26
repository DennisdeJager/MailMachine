# Story Refinement - Outlook Classifier Admin

## User story

Als beheerder wil ik een webapplicatie waarmee ik Outlook-mailboxen via Microsoft Graph kan monitoren en e-mails automatisch kan classificeren met configureerbare regels en Outlook-categorieen, zodat inkomende mail consistent wordt gelabeld zonder handmatig sorteerwerk.

## Scope

- Admin UI voor dashboard, mailboxen, credentials, categorieen, classificatieregels, auditlog en Microsoft setup.
- PostgreSQL-opslag voor alle persistente beheerdata.
- Secure credential vault met versleutelde client secrets.
- Microsoft OAuth/client-credential setup-hulp met redirect URI, admin-consent URL en permission manifest.
- API v1 voor CRUD en monitor-run.
- Classificatie op afzender, onderwerp, body preview en bijlage-aanwezigheid.
- Outlook category labels toepassen via Microsoft Graph.

## Out of scope

- Productie-deployment naar ALM DEV in deze Development-run.
- Multi-tenant gebruikerslogin met rollenmodel buiten de admin token gate.
- Background scheduler infrastructuur; de monitor-run is als API beschikbaar voor cron/ALM scheduler.

## Acceptatiecriteria

- Beheerder kan credentials, mailboxen, categorieen en regels aanmaken en verwijderen.
- Client secrets worden niet plaintext opgeslagen.
- Monitor-run haalt berichten op via Graph, matcht regels en past categorieen toe.
- Elke mutatie wordt geaudit.
- UI heeft lege staten, foutmeldingen, responsive layout en duidelijke Nederlandse labels.
- App bouwt zonder databaseverbinding doordat databaseclients lazy initialiseren.

## Security-impact

Security is van toepassing. Maatregelen: AES-GCM encryptie, geen secretwaarden in rapportage, admin-tokencontrole op muterende API's, server-side validatie, auditlog en geen database-exposure.

## UX-impact

UX is van toepassing. Hoofdrecord is de mailboxmonitor; gerelateerde records zijn credentials, regels en categorieen. De beheerinterface gebruikt overzichtstabellen, formulieren, statusbadges, lege staten en touch targets.

## Data/API-impact

Nieuwe PostgreSQL-tabellen: credential vault, mailbox connections, Outlook categories, classification rules, classified messages en audit events. API's staan onder `/api/v1`.

## Dependency-check

Geen blokkerende story-dependency gevonden. Microsoft tenant/appregistratie is een runtime beheeractie, ondersteund door de setup-wizard.

## T-shirt size

XL. Onderbouwing: externe OAuth/Graph-integratie, secure credential management, meerdere beheerentiteiten, UI, audit en classificatielogica.

## Definition of Ready

- [x] Scope en out of scope beschreven
- [x] Acceptatiecriteria beschreven
- [x] UX-output aanwezig
- [x] Security-output aanwezig
- [x] Testplan aanwezig
- [x] Geen open dependency
