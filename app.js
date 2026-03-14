const q = document.getElementById('q');
const city = document.getElementById('city');
const minRating = document.getElementById('minRating');
const list = document.getElementById('list');
const count = document.getElementById('count');
const status = document.getElementById('status');
const retry = document.getElementById('retry');

let places = [];
let map;
let markers = [];

function uniq(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ca'));
}

function safeText(value, fallback = '-') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function safeUrl(value) {
  if (!value) return '#';
  try {
    const parsed = new URL(String(value));
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString();
  } catch (_) {
    // noop
  }
  return '#';
}

function normalizeRating(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(5, n));
}

function stars(value) {
  const rating = normalizeRating(value);
  if (rating === null) return '—';
  const rounded = Math.round(rating * 2) / 2;
  const full = Math.floor(rounded);
  const half = rounded % 1 !== 0;
  const empty = 5 - full - (half ? 1 : 0);
  return `${'★'.repeat(full)}${half ? '⯪' : ''}${'☆'.repeat(empty)}`;
}

function toSafePhotos(photos) {
  if (!Array.isArray(photos)) return [];
  return photos.map((photo) => safeUrl(photo)).filter((url) => url !== '#');
}

function setStatus(message = '', kind = 'info') {
  status.textContent = message;
  status.classList.toggle('error', kind === 'error');
}

function clearFilters() {
  city.innerHTML = '<option value="">Totes les ciutats</option>';
}

function fillFilters() {
  for (const c of uniq(places.map((p) => p.city))) {
    const o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    city.appendChild(o);
  }
}

function matches(p) {
  const text = (q.value || '').trim().toLowerCase();
  const hay = [p.name, p.city, (p.tags || []).join(' '), p.notes || ''].join(' ').toLowerCase();
  if (text && !hay.includes(text)) return false;
  if (city.value && p.city !== city.value) return false;

  const min = Number(minRating.value);
  const rating = getFilterRating(p);
  if (minRating.value && (rating === null || rating < min)) return false;

  return true;
}

function buildMapsLink(url, label = 'Obrir a Google Maps ↗') {
  const link = document.createElement('a');
  link.href = safeUrl(url);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = label;

  if (link.href.endsWith('/#')) {
    link.removeAttribute('target');
    link.removeAttribute('rel');
    link.textContent = 'Enllaç no disponible';
  }

  return link;
}

function buildRatingMeta(p) {
  const rating = normalizeRating(p.rating);
  const meta = document.createElement('div');
  meta.className = 'rating';

  if (rating === null) {
    meta.textContent = 'Sense valoracions';
    return meta;
  }

  const reviews = Number.isFinite(Number(p.reviewCount)) ? ` (${p.reviewCount})` : '';
  meta.textContent = `${stars(rating)} ${rating.toFixed(1)}${reviews}`;
  return meta;
}

function buildPhotos(p) {
  const photos = toSafePhotos(p.photos);
  if (!photos.length) return null;

  const wrap = document.createElement('div');
  wrap.className = 'photos';

  for (const [index, src] of photos.slice(0, 4).entries()) {
    const image = document.createElement('img');
    image.src = src;
    image.loading = 'lazy';
    image.alt = `Foto de ${safeText(p.name, 'lloc')} ${index + 1}`;
    wrap.appendChild(image);
  }

  return wrap;
}

function card(p) {
  const el = document.createElement('article');
  el.className = 'card';

  const title = document.createElement('h3');
  title.textContent = safeText(p.name, 'Sense nom');
  el.appendChild(title);

  const metaMain = document.createElement('div');
  metaMain.className = 'meta';
  metaMain.textContent = `${safeText(p.city)}`;
  el.appendChild(metaMain);

  el.appendChild(buildRatingMeta(p));

  const metaCoords = document.createElement('div');
  metaCoords.className = 'meta';
  metaCoords.textContent = `${p.lat ?? '-'}, ${p.lng ?? '-'}`;
  el.appendChild(metaCoords);

  const photoStrip = buildPhotos(p);
  if (photoStrip) el.appendChild(photoStrip);

  const links = document.createElement('div');
  links.className = 'links';
  links.appendChild(buildMapsLink(p.mapsUrl));
  el.appendChild(links);

  if (p.notes) {
    const notes = document.createElement('p');
    notes.textContent = safeText(p.notes, '');
    el.appendChild(notes);
  }

  const tags = document.createElement('div');
  tags.className = 'tags';
  for (const tagValue of p.tags || []) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = `#${safeText(tagValue, '')}`;
    tags.appendChild(tag);
  }
  el.appendChild(tags);

  return el;
}

function createPopupNode(p) {
  const container = document.createElement('div');
  container.className = 'popup';

  const title = document.createElement('strong');
  title.textContent = safeText(p.name, 'Sense nom');
  container.appendChild(title);
  container.appendChild(document.createElement('br'));

  const cityText = document.createTextNode(safeText(p.city, ''));
  container.appendChild(cityText);
  container.appendChild(document.createElement('br'));

  const rating = normalizeRating(p.rating);
  if (rating !== null) {
    container.appendChild(document.createTextNode(`${stars(rating)} ${rating.toFixed(1)}`));
    container.appendChild(document.createElement('br'));
  }

  container.appendChild(buildMapsLink(p.mapsUrl, 'Google Maps'));

  return container;
}

function clearMarkers() {
  for (const marker of markers) {
    marker.remove();
  }
  markers = [];
}

function initMap() {
  map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/positron',
    center: [2.8249, 41.9831],
    zoom: 12,
    attributionControl: true,
    antialias: true
  });

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

  const resize = () => map.resize();
  window.addEventListener('resize', resize);
}

function renderMap(filtered) {
  if (!map) return;

  clearMarkers();

  const withCoords = filtered.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (!withCoords.length) return;

  for (const p of withCoords) {
    const popup = new maplibregl.Popup({ offset: 20 }).setDOMContent(createPopupNode(p));
    const marker = new maplibregl.Marker({ color: '#ff7a59' })
      .setLngLat([p.lng, p.lat])
      .setPopup(popup)
      .addTo(map);

    markers.push(marker);
  }

  if (withCoords.length === 1) {
    map.easeTo({
      center: [withCoords[0].lng, withCoords[0].lat],
      zoom: 14,
      duration: 700
    });
    return;
  }

  const bounds = new maplibregl.LngLatBounds();
  for (const p of withCoords) bounds.extend([p.lng, p.lat]);

  map.fitBounds(bounds, {
    padding: 50,
    maxZoom: 15,
    duration: 700
  });
}

function render() {
  const filtered = places.filter(matches);
  count.textContent = `${filtered.length} llocs`;
  list.innerHTML = '';
  filtered.forEach((p) => list.appendChild(card(p)));
  renderMap(filtered);
}

async function loadPlaces() {
  setStatus('Carregant llocs...');
  retry.hidden = true;

  const res = await fetch('places.json', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`No s'ha pogut carregar places.json (${res.status})`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("places.json no té el format esperat (array)");
  }

  places = data;
  clearFilters();
  fillFilters();
  render();
  setStatus('');
}

async function init() {
  initMap();
  map.on('load', () => renderMap(places));

  [q, city, minRating].forEach((el) => el.addEventListener('input', render));
  retry.addEventListener('click', () => {
    loadPlaces().catch((error) => {
      setStatus(error.message || 'Error carregant les dades.', 'error');
      retry.hidden = false;
    });
  });

  try {
    await loadPlaces();
  } catch (error) {
    list.innerHTML = '';
    count.textContent = '0 llocs';
    setStatus(error.message || 'Error carregant les dades.', 'error');
    retry.hidden = false;
  }
}

init();
 'error');
      retry.hidden = false;
    });
  });

  try {
    await loadPlaces();
  } catch (error) {
    list.innerHTML = '';
    count.textContent = '0 llocs';
    setStatus(error.message || 'Error carregant les dades.', 'error');
    retry.hidden = false;
  }
}

init();
ces));

  [q, city, minRating].forEach((el) => el.addEventListener('input', render));
  retry.addEventListener('click', () => {
    loadPlaces().catch((error) => {
      setStatus(error.message || 'Error carregant les dades.', 'error');
      retry.hidden = false;
    });
  });

  try {
    await loadPlaces();
  } catch (error) {
    list.innerHTML = '';
    count.textContent = '0 llocs';
    setStatus(error.message || 'Error carregant les dades.', 'error');
    retry.hidden = false;
  }
}

init();
