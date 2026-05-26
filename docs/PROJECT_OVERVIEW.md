# Project Overview

## Status

Development is uitgebreid met PostgreSQL runtime en herwerkte Microsoft setup-flow. DEV draait opnieuw met interne PostgreSQL container en database-aware healthcheck.

## Product

Outlook Classifier Admin monitort Microsoft Outlook-mailboxen via Graph en past Outlook-categorieen toe op basis van beheerbare classificatieregels.

## Belangrijkste onderdelen

- Admin UI met dashboard, mailboxes, rules, categories, credentials, setup en auditlog.
- Interne PostgreSQL compose-service met automatische migraties bij webcontainerstart.
- AES-GCM credential vault.
- Microsoft Graph client-credential integratie.
- API v1 voor beheer en monitor-run.
