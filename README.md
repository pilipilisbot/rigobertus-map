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
    "notes": "Opcional",
    "externalRating": 4.7,
    "externalReviewCount": 213,
    "rigobertusRating": 4.4,
    "photos": [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
    ]
  }
]
```

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

A CI també s'executa automàticament a cada PR amb `.github/workflows/validate-places.yml`.

## Publicació

La workflow `.github/workflows/pages.yml` desplega automàticament a GitHub Pages quan fas push a `main`.
