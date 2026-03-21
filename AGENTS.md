# AI_AGENTS.md — Instruccions per agents AI (rigobertus-map)

Aquest document resumeix criteris i decisions pràctiques del repo perquè qualsevol agent (Codex/Claude/GPT/etc.) treballi amb qualitat i sense regressions.

## 1) Objectiu del projecte

Mapa + llista de restaurants (`places.json`) amb filtres, targetes, destacat, i interacció mapa-llista.

Prioritats:
- UX fluïda
- Accessibilitat
- Dades consistents
- Canvis petits i segurs

---

## 2) Regles de dades (contracte actual)

### `places.json`
- Estructura principal: **array** d'entrades.
- `status` vàlids: `wishlist` o `visited`.
- Evitar valors fora de catàleg (ex. `pending`) excepte migracions temporals explícites.

### Notes editorials vs metadades tècniques
- `notes`: text editorial llegible per usuari (curt, clar, en català quan sigui possible).
- Metadades tècniques/importació: guardar-les a `sourceMeta.import` (no a `notes`).
- La UI principal no ha d'exposar metadades tècniques per defecte.

### Validació
- Validació de dades amb schema + regles extra:
  - `schema/places.schema.json`
  - `scripts/validate-places.mjs`
- Executar localment abans de PR:
  - `npm run validate:places`

---

## 3) UX i disseny (estàndard)

### Filtres i URL
- Els filtres (`q`, `city`, `minRating`, `status`) s'han de sincronitzar amb query params.
- Back/forward (`popstate`) ha de restaurar context correctament.
- `?place=<id>` ha de conviure amb filtres.

### Botó “Netejar filtres”
- Visible i accessible a desktop i mòbil.
- Reset complet de filtres + URL de filtres.
- Estètica cuidada (consistent amb el tema visual del projecte).

### Empty state
- Mostrar estat buit només quan hi ha 0 resultats en context de filtre/cerca.
- Incloure CTA de netejar filtres.

### Interacció targeta ↔ mapa
- Click de targeta i teclat (Enter/Espai) han d'activar `focusPlace`.
- No trencar links/botons interns de la targeta.
- Estat visual de targeta seleccionada (`.card-selected`) sincronitzat.

---

## 4) Accessibilitat obligatòria

- Modal d'imatges amb:
  - focus trap (Tab/Shift+Tab)
  - focus inicial a tancar
  - retorn de focus a l'element que obre el modal
  - `role="dialog"`, `aria-modal="true"`, etiquetatge correcte
- Respectar `prefers-reduced-motion` (CSS + animacions del mapa).
- Mantenir `:focus-visible` clar en elements interactius.

---

## 5) Performance

- Debounce de cerca (actualment ~200ms).
- Evitar re-renders innecessaris de llista.
- Reutilitzar markers del mapa sempre que sigui possible (no recrear-los sense necessitat).

---

## 6) Flux de treball per agents

1. Crear branca `fix/issue-<num>` o `docs/...` segons el cas.
2. Fer canvis mínims i enfocats al scope.
3. Validar:
   - `node --check app.js` (si toca JS)
   - `npm run validate:places` (si toca dades/schema)
4. Commit clar amb referència d'issue (`Fixes #N` o `Fixes owner/repo#N`).
5. Obrir PR amb resum curt, llista de canvis i validació.
6. Si hi ha conflictes: rebase/merge amb `main`, resoldre netament i tornar a validar.

---

## 7) Estil de canvis esperat

- Evitar refactors grans no demanats.
- Evitar barrejar múltiples problemes en una sola PR.
- Prioritzar llegibilitat i coherència visual.
- Quan hi hagi dubtes de disseny, triar opció “neta, simple i bonica”.

---

## 8) Pendent conegut (a data d'ara)

Issues obertes encara pendents:
- #21 (estratègia CDN/runtime)
- #22 (smoke tests E2E)

La resta del bloc UX/A11y/Data principal ja està treballat via PRs recents.
