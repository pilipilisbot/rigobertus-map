# Rigobertus Map

Mapa estàtic de llocs recomanats per publicar a GitHub Pages.

## Com funciona

- Les dades viuen a `places.json`
- Aquesta web només llegeix i mostra
- El mapa usa MapLibre GL amb vector tiles (OpenFreeMap style `positron`)
- El render de dades de `places.json` evita `innerHTML` amb camps d'usuari per minimitzar risc XSS
- Si falla la càrrega de `places.json`, la UI mostra error i ofereix retry
- Layout responsive millorat i focus visible per accessibilitat (mòbil + teclat)
- Fitxes amb valoració externa + valoració Rigobertus, recompte de reviews i fotos
- Filtre per valoració mínima (prioritza Rigobertus si existeix)
- Enllaços compartibles de fitxa (`?place=<id>`) des de la fitxa i el popup del mapa, amb destacat visual i bloc resum sobre el mapa
- Estat de valoració clar: pendent visita, pendent valoració Rigobertus o valoració publicada
- Els canvis es fan via commit/PR

## Esquema mínim (`places.json`)

```json
[
  {
    "id": "slug-unic",
    "name": "Nom del lloc",
    "lat": 41.98,
    "lng": 2.82,
    "city": "Girona",
    "category": "restaurant",
    "tags": ["top", "sopar"],
    "mapsUrl": "https://maps.google.com/?q=41.98,2.82",
    "notes": "Comentari editorial curt i llegible",
    "sourceMeta": {
      "import": {
        "provider": "google-places",
        "method": "validated",
        "address": "Carrer Exemple, 1, Girona",
        "rawNote": "Validat amb Google Places: Carrer Exemple, 1, Girona"
      }
    },
    "externalRating": 4.7,
    "externalReviewCount": 213,
    "rigobertusRating": 4.4,
    "photos": [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
    ]
  }
]
```

## Contracte canònic de fitxa

Veure `docs/cards-spec.md` per la definició oficial de:

- camps obligatoris i opcionals
- catàleg d'estats vàlids (`wishlist | visited`)
- ordre visual de la targeta
- regles de consistència i validació

## Validació local de dades

Abans de pujar canvis a `places.json`, valida'ls en local:

```bash
npm install
npm run validate:places
```

La validació comprova:

- schema bàsic i tipus de camps
- `id` únic (sense duplicats)
- rangs de coordenades (`lat/lng`) i valoracions (`0..5`)

## Guia ràpida d'estil per a `notes`

- **To:** natural i útil per a qui llegeix la fitxa (no text tècnic)
- **Llargada:** idealment 1 frase curta (aprox. 8-20 paraules)
- **Idioma:** català, mantenint estil consistent entre fitxes
- **Evita a `notes`:** queries, adreces completes d'importació, o textos de depuració
- **Metadades tècniques:** guarda-les a `sourceMeta` (p. ex. `sourceMeta.import`)

A CI també s'executa automàticament a cada PR amb `.github/workflows/validate-places.yml`.

## Governança editorial i canvis de dades

- Guia editorial + checklist per noves entrades: [`docs/editorial-governance.md`](docs/editorial-governance.md)
- Plantilla de PR reutilitzable per canvis de dades: [`.github/pull_request_template.md`](.github/pull_request_template.md)

## Publicació

La workflow `.github/workflows/pages.yml` desplega automàticament a GitHub Pages quan fas push a `main`.
