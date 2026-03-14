# Rigobertus Map

Viewer estàtic de llocs per GitHub Pages.

## Com funciona

- Les dades viuen a `places.json`
- Aquesta web només llegeix i mostra
- El mapa usa MapLibre GL amb vector tiles (OpenFreeMap style `positron`)
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
    "notes": "Opcional"
  }
]
```

## Publicació

La workflow `.github/workflows/pages.yml` desplega automàticament a GitHub Pages quan fas push a `main`.
