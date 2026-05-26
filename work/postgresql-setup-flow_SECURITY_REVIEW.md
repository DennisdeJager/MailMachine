# Security Review - PostgreSQL en Microsoft setup-flow

## Impact

Security-impact is van toepassing door database secrets, credential vault encryptie en Microsoft tenant consent.

## Maatregelen

- PostgreSQL draait zonder externe `ports:` mapping en is alleen intern bereikbaar via Docker networking.
- `POSTGRES_PASSWORD` en `CREDENTIAL_ENCRYPTION_KEY` komen uit runtime/GitHub secrets en worden niet gecommit.
- De deployment workflow faalt expliciet als verplichte secrets ontbreken.
- Client secrets uit Microsoft worden alleen in de credential vault opgeslagen en daar server-side versleuteld.
- Het Microsoft setup-script blijft reviewbaar en wordt niet stilzwijgend door de app uitgevoerd.

## Resterend risico

- Programmatic admin consent blijft tenant-impact hebben en moet door een bevoegde beheerder bewust worden uitgevoerd.
- Secretrotatie moet operationeel worden geborgd.
