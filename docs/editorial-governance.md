# Guia editorial i checklist de noves entrades

Aquesta guia defineix criteris mínims per mantenir `places.json` coherent, útil i fàcil de revisar.

## Normes editorials (resum)

- **Idioma principal:** català (`ca`) a `name`, `city`, `tags` i `notes` (quan no sigui nom propi).
- **Format de data:** `YYYY-MM-DD` (per exemple `2026-03-21`) a camps com `visitedAt`.
- **To de les notes:** clar, descriptiu i neutral (evitar insults, exageracions o text promocional).
- **Longitud de notes:** màxim **240 caràcters**.
- **Tags recomanats:**
  - usa tags curts en minúscula i `kebab-case` (ex. `barri-vell`, `baix-emporda`)
  - entre **1 i 5 tags** per entrada
  - evitar duplicats, sinònims redundants i tags massa genèrics

## Camps mínims per acceptar una nova entrada

Abans d'acceptar una nova entrada, ha de tenir com a mínim:

- `id` únic (slug en minúscula i amb guions)
- `name`
- `lat` i `lng`
- `city`
- `category` (`restaurant` o `bar`)
- `tags` (1..5)
- `mapsUrl`
- `status` (`wishlist`, `visited` o `pending`)
- `externalRating`
- `externalReviewCount`

> Important: qualsevol camp opcional afegit ha de respectar l'esquema JSON i no trencar `npm run validate:places`.

## Checklist ràpid per afegir un lloc

- [ ] L'entrada compleix els **camps mínims obligatoris**
- [ ] L'`id` és únic i en format slug (`kebab-case`)
- [ ] Coordenades i URL de mapes verificades
- [ ] Textos en català (excepte noms propis)
- [ ] Dates en format `YYYY-MM-DD`
- [ ] `notes` neutrals i ≤ 240 caràcters
- [ ] `tags` en minúscula, sense duplicats, entre 1 i 5
- [ ] Validació local executada: `npm run validate:places`
