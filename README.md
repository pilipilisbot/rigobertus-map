# Rigobertus Map

Viewer estàtic de llocs per GitHub Pages.

## Com funciona

- Les dades viuen a `places.json`
- Aquesta web només llegeix i mostra
- El mapa usa MapLibre GL amb vector tiles (OpenFreeMap style `positron`)
- El render de dades de `places.json` evita `innerHTML` amb camps d'usuari per minimitzar risc XSS
- Si falla la càrrega de `places.json`, la UI mostra error i ofereix retry
- Layout responsive millorat i focus visible per accessibilitat (mòbil + teclat)
- Fitxes amb valoració, recompte de reviews i fotos
- Filtre per valoració mínima
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
    "rating": 4.7,
    "reviewCount": 213,
    "photos": [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
    ]
  }
]
```

## Publicació

La workflow `.github/workflows/pages.yml` desplega automàticament a GitHub Pages quan fas push a `main`.
