const q = document.getElementById('q');
const city = document.getElementById('city');
const category = document.getElementById('category');
const list = document.getElementById('list');
const count = document.getElementById('count');

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

function fillFilters() {
  for (const c of uniq(places.map((p) => p.city))) {
    const o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    city.appendChild(o);
  }
  for (const c of uniq(places.map((p) => p.category))) {
    const o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    category.appendChild(o);
  }
}

function matches(p) {
  const text = (q.value || '').trim().toLowerCase();
  const hay = [p.name, p.city, p.category, (p.tags || []).join(' '), p.notes || ''].join(' ').toLowerCase();
  if (text && !hay.includes(text)) return false;
  if (city.value && p.city !== city.value) return false;
  if (category.value && p.category !== category.value) return false;
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

function card(p) {
  const el = document.createElement('article');
  el.className = 'card';

  const title = document.createElement('h3');
  title.textContent = safeText(p.name, 'Sense nom');
  el.appendChild(title);

  const metaMain = document.createElement('div');
  metaMain.className = 'meta';
  metaMain.textContent = `${safeText(p.city)} · ${safeText(p.category)}`;
  el.appendChild(metaMain);

  const metaCoords = document.createElement('div');
  metaCoords.className = 'meta';
  metaCoords.textContent = `${p.lat ?? '-'}, ${p.lng ?? '-'}`;
  el.appendChild(metaCoords);

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

async function init() {
  const res = await fetch('places.json');
  places = await res.json();

  initMap();
  map.on('load', () => renderMap(places));

  fillFilters();
  [q, city, category].forEach((el) => el.addEventListener('input', render));
  render();
}

init();
