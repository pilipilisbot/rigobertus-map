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

function card(p) {
  const el = document.createElement('article');
  el.className = 'card';
  el.innerHTML = `
    <h3>${p.name}</h3>
    <div class="meta">${p.city || '-'} · ${p.category || '-'}</div>
    <div class="meta">${p.lat ?? '-'}, ${p.lng ?? '-'}</div>
    <div class="links"><a href="${p.mapsUrl}" target="_blank" rel="noopener">Obrir a Google Maps ↗</a></div>
    ${p.notes ? `<p>${p.notes}</p>` : ''}
    <div class="tags">${(p.tags || []).map((t) => `<span class="tag">#${t}</span>`).join('')}</div>
  `;
  return el;
}

function createPopupHtml(p) {
  return `
    <div class="popup">
      <strong>${p.name}</strong><br>
      ${p.city || ''}<br>
      <a href="${p.mapsUrl}" target="_blank" rel="noopener">Google Maps</a>
    </div>
  `;
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
    const popup = new maplibregl.Popup({ offset: 20 }).setHTML(createPopupHtml(p));
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
