# Rigobertus Map

Mapa estàtic de llocs recomanats per publicar a GitHub Pages.

## Per agents AI

Si treballes amb agents AI en aquest repo, consulta primer `AGENTS.md` per convencions, qualitat i flux de treball.

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
- Analítica cookieless amb Umami (opcional, configurable)

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

## Analítica (Umami, cookieless)

Aquest projecte incorpora suport per Umami Cloud (sense cookies):

1. Crea web a Umami i copia el `website-id`.
2. A `index.html`, substitueix:
   - `data-website-id="REPLACE_WITH_UMAMI_WEBSITE_ID"`
3. Publica a GitHub Pages.

Si el `website-id` és placeholder, els events queden en no-op i la web funciona igual.

### Events trackejats

- `places_loaded`
- `places_load_error`
- `search_used`
- `filter_city_changed`
- `filter_rating_changed`
- `filter_status_changed`
- `place_focus`
- `place_share_link_click`
- `maps_link_click`
- `photo_modal_open`
- `photo_modal_navigate`
- `photo_modal_close`
- `retry_load_places`

### Nota legal (orientativa)

- Sense cookies d’analítica ⇒ habitualment sense banner de cookies.
- Mantén igualment política de privacitat i avís legal.
- No enviïs dades personals als events.

## Structured data (SEO)

- El projecte publica JSON-LD tipus `WebSite` a `index.html`.
- L’`ItemList` queda pendent per una fase posterior, quan definim millor una estratègia de llistes/pàgines indexables per evitar marcatge poc estable.

## Publicació

La workflow `.github/workflows/pages.yml` desplega automàticament a GitHub Pages quan fas push a `main`.
