# UX Review - PostgreSQL en Microsoft setup-flow

## Impact

UI-impact is van toepassing. Het Microsoft setup-scherm was te lang en te moeilijk te volgen.

## Besluit

De setup is opgesplitst in een begeleide tab-flow:

- Overzicht: wat wordt aangemaakt en wat niet automatisch gebeurt.
- Rechten: Entra-rollen, bootstrap-scopes, application permissions en security waarschuwingen.
- Uitvoeren: PowerShell stappen en kopieerbaar script.
- Opslaan: Tenant ID, Client ID en Client secret naar credential vault.
- Controleren: post-run checks en manifest patch.

## Controle

- Lange Microsoft consent URLs breken af binnen de kaart.
- Mobiele horizontale overflow is hertest en opgelost.
- De flow houdt tenant-impact en secret-opslag zichtbaar voor de beheerder.
