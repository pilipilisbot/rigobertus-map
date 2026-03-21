# Contracte canònic de fitxa de restaurant

Aquest document defineix el contracte de dades + presentació per a cada targeta renderitzada des de `places.json`.

## Objectiu

- Tenir un catàleg de camps clar i estable
- Evitar estats i continguts inconsistents
- Facilitar validació automàtica abans de publicar

## Catàleg de camps

### Camps obligatoris (targeta funcional)

- `id` (`string`, slug únic)
- `name` (`string`)
- `lat` (`number|null`)
- `lng` (`number|null`)
- `city` (`string`)
- `category` (`"restaurant"|"bar"`)
- `tags` (`string[]`, pot ser buit)
- `mapsUrl` (`string`, URL)
- `status` (`"wishlist"|"visited"`)
- `externalRating` (`number`, `0..5`)
- `externalReviewCount` (`integer`, `>=0`)

### Camps opcionals controlats

- `rigobertusRating` (`number|null`, `0..5`)
- `visitedAt` (`YYYY-MM-DD`)
- `notes` (`string`)
- `photos` (`string[]`)
- `placeId` (`string`)
- `website` (`string`, URL)
- `planned` (`boolean`)

## Estats vàlids

Només es permeten aquests valors:

- `wishlist` → lloc pendent de visita
- `visited` → lloc visitat

> `pending` queda **retirat** i s’ha de migrar a `wishlist`.

## Contracte visual (ordre de blocs de targeta)

Ordre canònic de render a UI:

1. Títol (`name`) + badge d’estat (`status`)
2. Ciutat (`city`)
3. Bloc de valoració:
   - `rigobertusRating` si existeix i el lloc és `visited`
   - si no, missatge de pendent
   - `externalRating` + `externalReviewCount` com a referència
4. Visita (`visitedAt` si existeix; altrament `—`)
5. Fotos (`photos`) o placeholder
6. Enllaços (Maps + compartir fitxa)
7. Notes (`notes`) o placeholder
8. Tags (`tags`) o placeholder

## Regles de consistència pràctiques

- `id` ha de ser únic a tot `places.json`
- `lat/lng` han de ser dos números vàlids o tots dos `null`
- valoracions (`externalRating`, `rigobertusRating`) sempre dins `0..5`
- no admetre estats fora del catàleg (`wishlist|visited`)

## Validació

La validació s’executa amb:

```bash
npm run validate:places
```

Inclou schema JSON i comprovacions addicionals (`id` duplicat, rangs i coordenades).