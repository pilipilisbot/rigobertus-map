const q = document.getElementById('q');
const city = document.getElementById('city');
const minRating = document.getElementById('minRating');
const statusFilter = document.getElementById('statusFilter');
const list = document.getElementById('list');
const count = document.getElementById('count');
const status = document.getElementById('status');
const featuredPlace = document.getElementById('featuredPlace');
const retry = document.getElementById('retry');
const buildInfo = document.getElementById('buildInfo');
const imageModal = document.getElementById('imageModal');
const imageModalImg = document.getElementById('imageModalImg');
const imageModalClose = document.getElementById('imageModalClose');
const imageModalPrev = document.getElementById('imageModalPrev');
const imageModalNext = document.getElementById('imageModalNext');
const imageModalCounter = document.getElementById('imageModalCounter');

let places = [];
let map;
let markers = [];
let modalPhotos = [];
let modalIndex = 0;
let markerById = new Map();
let pendingPlaceId = null;
let featuredPlaceId = null;

function uniq(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ca'));
}

function safeText(value, fallback = '-') {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function normalizePlaceId(value) {
  const text = safeText(value, '').toLowerCase();
  return text.replace(/[^a-z0-9-_]/g, '');
}

function getPlaceParamFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return normalizePlaceId(params.get('place'));
}

function buildPlaceShareUrl(placeId) {
  const normalized = normalizePlaceId(placeId);
  if (!normalized) return '';

  const url = new URL(window.location.href);
  url.searchParams.set('place', normalized);
  url.hash = '';
  return url.toString();
}

function highlightPlaceCard(placeId, options = {}) {
  const { scroll = false } = options;
  const safeId = normalizePlaceId(placeId);
  if (!safeId) return;
  const target = document.getElementById(`place-${safeId}`);
  if (!target) return;

  if (scroll) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  target.classList.add('card-highlight');
  setTimeout(() => target.classList.remove('card-highlight'), 1400);
}

function safeHttpUrl(value) {
  if (!value) return '#';
  try {
    const parsed = new URL(String(value));
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString();
  } catch (_) {
    // noop
  }
  return '#';
}

function safePhotoUrl(value) {
  if (!value) return '#';
  const raw = String(value).trim();
  if (!raw) return '#';

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return safeHttpUrl(raw);
  }

  // Allow local static asset paths (e.g. photos/bistrot/01.jpg)
  if (/^[a-zA-Z0-9._\-/]+$/.test(raw) && !raw.startsWith('//')) {
    // Resolve relative to current page (works for both custom domain and /repo paths)
    return new URL(raw, window.location.href).toString();
  }

  return '#';
}

function normalizeRating(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(5, n));
}

function getRigobertusRating(place) {
  return normalizeRating(place.rigobertusRating);
}

function getExternalRating(place) {
  return normalizeRating(place.externalRating);
}

function getDisplayRating(place) {
  return getRigobertusRating(place) ?? getExternalRating(place);
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
  return photos.map((photo) => safePhotoUrl(photo)).filter((url) => url !== '#');
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

function getPlaceStatus(p) {
  return p.status === 'visited' || p.status === 'wishlist' ? p.status : 'wishlist';
}

function statusLabel(status) {
  return status === 'visited' ? 'Visitat' : 'Per anar';
}

function statusEmoji(status) {
  return status === 'visited' ? '✅' : '📍';
}

function statusClass(status) {
  return status === 'visited' ? 'status-visited' : 'status-wishlist';
}

function markerColor(status) {
  return status === 'visited' ? '#22c55e' : '#f59e0b';
}

function matches(p) {
  const text = (q.value || '').trim().toLowerCase();
  const hay = [p.name, p.city, (p.tags || []).join(' '), p.notes || ''].join(' ').toLowerCase();
  if (text && !hay.includes(text)) return false;
  if (city.value && p.city !== city.value) return false;

  const min = Number(minRating.value);
  const rating = getDisplayRating(p);
  if (minRating.value && (rating === null || rating < min)) return false;

  if (statusFilter.value) {
    const currentStatus = getPlaceStatus(p);
    if (currentStatus !== statusFilter.value) return false;
  }

  return true;
}

function buildMapsLink(url, label = 'Obrir a Google Maps ↗') {
  const link = document.createElement('a');
  link.href = safeHttpUrl(url);
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

function buildPlaceLink(placeId, label = 'Veure fitxa') {
  const link = document.createElement('a');
  const shareUrl = buildPlaceShareUrl(placeId);
  link.href = shareUrl || '#';
  link.textContent = shareUrl ? label : 'Enllaç no disponible';

  if (!shareUrl) {
    link.removeAttribute('href');
    return link;
  }

  link.addEventListener('click', (event) => {
    event.preventDefault();
    const id = normalizePlaceId(placeId);
    if (!id) return;
    history.replaceState({}, '', `?place=${encodeURIComponent(id)}`);
    focusPlace(id, { openPopup: true, updateUrl: false });
  });

  return link;
}

function buildRatingMeta(p) {
  const meta = document.createElement('div');
  meta.className = 'rating';

  const status = getPlaceStatus(p);
  const rigRating = getRigobertusRating(p);
  const externalRating = getExternalRating(p);
  const reviews = Number.isFinite(Number(p.externalReviewCount)) ? ` (${p.externalReviewCount})` : '';

  if (status !== 'visited') {
    const line = document.createElement('div');
    line.className = 'rating-pending';
    line.textContent = 'Rigobertus: pendent visita';
    meta.appendChild(line);

    if (externalRating !== null) {
      const ext = document.createElement('div');
      ext.className = 'rating-sub';
      ext.textContent = `Referència externa: ${stars(externalRating)} ${externalRating.toFixed(1)}${reviews}`;
      meta.appendChild(ext);
    }

    return meta;
  }

  if (rigRating === null) {
    const line = document.createElement('div');
    line.className = 'rating-pending';
    line.textContent = '📝 Pendent d’emetre valoració Rigobertus';
    meta.appendChild(line);

    if (externalRating !== null) {
      const ext = document.createElement('div');
      ext.className = 'rating-sub';
      ext.textContent = `Referència externa: ${stars(externalRating)} ${externalRating.toFixed(1)}${reviews}`;
      meta.appendChild(ext);
    }

    return meta;
  }

  const main = document.createElement('div');
  main.textContent = `Rigobertus: ${stars(rigRating)} ${rigRating.toFixed(1)}`;
  meta.appendChild(main);

  if (externalRating !== null) {
    const ext = document.createElement('div');
    ext.className = 'rating-sub';
    ext.textContent = `Externa: ${stars(externalRating)} ${externalRating.toFixed(1)}${reviews}`;
    meta.appendChild(ext);
  }

  return meta;
}

function renderFeaturedPlace() {
  if (!featuredPlace) return;

  const safeId = normalizePlaceId(featuredPlaceId);
  const place = safeId ? places.find((item) => normalizePlaceId(item.id) === safeId) : null;

  if (!place) {
    featuredPlace.hidden = true;
    featuredPlace.innerHTML = '';
    return;
  }

  const placeStatus = getPlaceStatus(place);
  featuredPlace.hidden = false;
  featuredPlace.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = `📌 Fitxa compartida: ${safeText(place.name, 'Lloc')}`;
  featuredPlace.appendChild(title);

  const meta = document.createElement('p');
  meta.className = 'featured-meta';
  meta.textContent = `${safeText(place.city)} · ${statusEmoji(placeStatus)} ${statusLabel(placeStatus)}`;
  featuredPlace.appendChild(meta);

  const rating = buildRatingMeta(place);
  rating.classList.add('featured-rating');
  featuredPlace.appendChild(rating);

  const links = document.createElement('p');
  links.className = 'featured-links';
  links.appendChild(buildMapsLink(place.mapsUrl));
  links.appendChild(document.createTextNode(' · '));
  links.appendChild(buildPlaceLink(safeId, 'Copiar/obrir enllaç de fitxa'));

  const jump = document.createElement('a');
  jump.href = `#place-${safeId}`;
  jump.textContent = 'Veure fitxa completa ↓';
  jump.addEventListener('click', (event) => {
    event.preventDefault();
    highlightPlaceCard(safeId, { scroll: true });
  });

  links.appendChild(document.createTextNode(' · '));
  links.appendChild(jump);
  featuredPlace.appendChild(links);
}

function updateModalControls() {
  if (imageModalCounter) {
    imageModalCounter.textContent = modalPhotos.length ? `${modalIndex + 1} / ${modalPhotos.length}` : '';
  }

  const hasMany = modalPhotos.length > 1;
  if (imageModalPrev) imageModalPrev.hidden = !hasMany;
  if (imageModalNext) imageModalNext.hidden = !hasMany;
}

function renderModalPhoto() {
  if (!imageModalImg || !modalPhotos.length) return;
  const current = modalPhotos[modalIndex];
  imageModalImg.src = current.src;
  imageModalImg.alt = current.alt;
  updateModalControls();
}

function openImageModal(items, startIndex = 0) {
  if (!imageModal || !imageModalImg || !Array.isArray(items) || !items.length) return;
  modalPhotos = items;
  modalIndex = Math.max(0, Math.min(startIndex, items.length - 1));
  renderModalPhoto();
  imageModal.hidden = false;
  imageModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function stepImageModal(delta) {
  if (!modalPhotos.length) return;
  modalIndex = (modalIndex + delta + modalPhotos.length) % modalPhotos.length;
  renderModalPhoto();
}

function closeImageModal() {
  if (!imageModal || !imageModalImg) return;
  imageModal.hidden = true;
  imageModal.setAttribute('aria-hidden', 'true');
  imageModalImg.src = '';
  modalPhotos = [];
  modalIndex = 0;
  updateModalControls();
  document.body.style.overflow = '';
}

function buildPhotos(p) {
  const photos = toSafePhotos(p.photos);
  if (!photos.length) return null;

  const wrap = document.createElement('div');
  wrap.className = 'photos';

  const modalItems = photos.map((src, index) => ({
    src,
    alt: `Foto de ${safeText(p.name, 'lloc')} ${index + 1}`,
  }));

  for (const [index, src] of photos.entries()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'photo-btn';
    button.setAttribute('aria-label', `Ampliar foto ${index + 1} de ${safeText(p.name, 'lloc')}`);

    const image = document.createElement('img');
    image.src = src;
    image.loading = 'lazy';
    image.alt = modalItems[index].alt;

    button.addEventListener('click', () => openImageModal(modalItems, index));
    button.appendChild(image);
    wrap.appendChild(button);
  }

  return wrap;
}

function card(p) {
  const el = document.createElement('article');
  el.className = 'card';
  const safeId = normalizePlaceId(p.id);
  if (safeId) el.id = `place-${safeId}`;

  const status = getPlaceStatus(p);

  const top = document.createElement('div');
  top.className = 'card-top';

  const title = document.createElement('h3');
  title.textContent = safeText(p.name, 'Sense nom');
  top.appendChild(title);

  const badge = document.createElement('div');
  badge.className = `status-badge ${statusClass(status)}`;
  badge.textContent = `${statusEmoji(status)} ${statusLabel(status)}`;
  top.appendChild(badge);

  el.appendChild(top);

  const metaMain = document.createElement('div');
  metaMain.className = 'meta';
  metaMain.textContent = `${safeText(p.city)}`;
  el.appendChild(metaMain);

  el.appendChild(buildRatingMeta(p));

  if (status === 'visited' && p.visitedAt) {
    const visitMeta = document.createElement('div');
    visitMeta.className = 'meta';
    visitMeta.textContent = `Última visita: ${safeText(p.visitedAt)}`;
    el.appendChild(visitMeta);
  }

  const photoStrip = buildPhotos(p);
  if (photoStrip) el.appendChild(photoStrip);

  const links = document.createElement('div');
  links.className = 'links';
  links.appendChild(buildMapsLink(p.mapsUrl));
  if (safeId) {
    links.appendChild(document.createTextNode(' · '));
    links.appendChild(buildPlaceLink(safeId, 'Compartir fitxa'));
  }
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

  container.appendChild(document.createTextNode(safeText(p.city, '')));
  container.appendChild(document.createElement('br'));

  const popupStatus = getPlaceStatus(p);
  const popupRigRating = getRigobertusRating(p);
  const popupExternalRating = getExternalRating(p);

  if (popupStatus !== 'visited') {
    container.appendChild(document.createTextNode('Rigobertus: pendent visita'));
    container.appendChild(document.createElement('br'));
  } else if (popupRigRating === null) {
    container.appendChild(document.createTextNode('Rigobertus: pendent valoració'));
    container.appendChild(document.createElement('br'));
  } else {
    container.appendChild(document.createTextNode(`Rigobertus: ${stars(popupRigRating)} ${popupRigRating.toFixed(1)}`));
    container.appendChild(document.createElement('br'));
  }

  if (popupExternalRating !== null) {
    container.appendChild(document.createTextNode(`Externa: ${stars(popupExternalRating)} ${popupExternalRating.toFixed(1)}`));
    container.appendChild(document.createElement('br'));
  }

  const status = popupStatus;
  const statusLine = document.createElement('span');
  statusLine.textContent = `${statusEmoji(status)} ${statusLabel(status)}`;
  container.appendChild(statusLine);
  container.appendChild(document.createElement('br'));

  if (status === 'visited' && p.visitedAt) {
    container.appendChild(document.createTextNode(`Última visita: ${safeText(p.visitedAt)}`));
    container.appendChild(document.createElement('br'));
  }

  const safeId = normalizePlaceId(p.id);
  if (safeId) {
    const internalLink = document.createElement('a');
    internalLink.href = `#place-${safeId}`;
    internalLink.textContent = 'Veure fitxa';
    internalLink.addEventListener('click', (event) => {
      event.preventDefault();
      focusPlace(safeId, { openPopup: true, scrollToCard: true });
    });
    container.appendChild(internalLink);
    container.appendChild(document.createTextNode(' · '));
  }

  container.appendChild(buildMapsLink(p.mapsUrl, 'Google Maps'));

  if (safeId) {
    container.appendChild(document.createTextNode(' · '));
    container.appendChild(buildPlaceLink(safeId, 'Compartir fitxa'));
  }

  return container;
}

function clearMarkers() {
  for (const marker of markers) marker.remove();
  markers = [];
  markerById.clear();
}

function focusPlace(placeId, options = {}) {
  const { openPopup = true, updateUrl = true, scrollToCard = false } = options;
  const safeId = normalizePlaceId(placeId);
  if (!safeId) return false;

  const marker = markerById.get(safeId);
  if (!marker) {
    pendingPlaceId = safeId;
    return false;
  }

  const lngLat = marker.getLngLat();
  if (map && lngLat) {
    map.easeTo({ center: [lngLat.lng, lngLat.lat], zoom: Math.max(map.getZoom(), 14), duration: 700 });
  }

  if (openPopup && marker.getPopup()) {
    marker.togglePopup();
    if (!marker.getPopup().isOpen()) marker.togglePopup();
  }

  if (updateUrl) {
    history.replaceState({}, '', `?place=${encodeURIComponent(safeId)}`);
  }

  featuredPlaceId = safeId;
  renderFeaturedPlace();
  highlightPlaceCard(safeId, { scroll: scrollToCard });

  const place = places.find((item) => normalizePlaceId(item.id) === safeId);
  if (place) {
    setStatus(`Mostrant fitxa compartida: ${safeText(place.name, 'lloc')}`);
  }

  pendingPlaceId = null;
  return true;
}

function initMap() {
  map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/positron',
    center: [2.8249, 41.9831],
    zoom: 12,
    attributionControl: true,
    antialias: true,
  });

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  window.addEventListener('resize', () => map.resize());
}

function renderMap(filtered) {
  if (!map) return;

  clearMarkers();

  const withCoords = filtered.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (!withCoords.length) return;

  for (const p of withCoords) {
    const popup = new maplibregl.Popup({ offset: 20 }).setDOMContent(createPopupNode(p));
    const marker = new maplibregl.Marker({ color: markerColor(getPlaceStatus(p)) })
      .setLngLat([p.lng, p.lat])
      .setPopup(popup)
      .addTo(map);

    markers.push(marker);

    const safeId = normalizePlaceId(p.id);
    if (safeId) markerById.set(safeId, marker);
  }

  if (withCoords.length === 1) {
    map.easeTo({ center: [withCoords[0].lng, withCoords[0].lat], zoom: 14, duration: 700 });
  } else {
    const bounds = new maplibregl.LngLatBounds();
    for (const p of withCoords) bounds.extend([p.lng, p.lat]);
    map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 700 });
  }

  if (pendingPlaceId) {
    setTimeout(() => focusPlace(pendingPlaceId, { openPopup: true, updateUrl: false }), 250);
  }
}

function render() {
  const filtered = places
    .filter(matches)
    .sort((a, b) => {
      const order = { wishlist: 0, visited: 1 };
      const sa = order[getPlaceStatus(a)] ?? 9;
      const sb = order[getPlaceStatus(b)] ?? 9;
      if (sa !== sb) return sa - sb;
      return safeText(a.name, '').localeCompare(safeText(b.name, ''), 'ca');
    });

  count.textContent = `${filtered.length} llocs`;
  list.innerHTML = '';
  filtered.forEach((p) => list.appendChild(card(p)));
  renderFeaturedPlace();
  renderMap(filtered);
}

async function loadPlaces() {
  setStatus('Carregant llocs...');
  retry.hidden = true;

  const res = await fetch('places.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`No s'ha pogut carregar places.json (${res.status})`);

  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("places.json no té el format esperat (array)");

  places = data;
  pendingPlaceId = getPlaceParamFromUrl() || null;
  featuredPlaceId = pendingPlaceId;
  clearFilters();
  fillFilters();
  render();
  setStatus('');
}

async function loadBuildInfo() {
  if (!buildInfo) return;

  try {
    let res = await fetch('/build-info.json', { cache: 'no-store' });
    if (!res.ok) {
      res = await fetch(`build-info.json?t=${Date.now()}`, { cache: 'no-store' });
    }
    if (!res.ok) throw new Error('build-info not found');

    const data = await res.json();
    const builtAt = data.builtAt ? new Date(data.builtAt) : null;
    const builtAtText = builtAt && !Number.isNaN(builtAt.getTime())
      ? builtAt.toLocaleString('ca-ES', { dateStyle: 'medium', timeStyle: 'short' })
      : 'data desconeguda';

    const sha = typeof data.sha === 'string' ? data.sha.slice(0, 7) : '';
    buildInfo.textContent = sha ? `últim build: ${builtAtText} (commit ${sha})` : `últim build: ${builtAtText}`;
  } catch (_) {
    buildInfo.textContent = 'últim build no disponible';
  }
}

async function init() {
  initMap();
  map.on('load', () => renderMap(places));

  if (imageModalClose) imageModalClose.addEventListener('click', closeImageModal);
  if (imageModalPrev) imageModalPrev.addEventListener('click', () => stepImageModal(-1));
  if (imageModalNext) imageModalNext.addEventListener('click', () => stepImageModal(1));

  if (imageModal) {
    imageModal.addEventListener('click', (event) => {
      if (event.target === imageModalClose || event.target === imageModalPrev || event.target === imageModalNext) {
        return;
      }

      // Standard behavior: click/tap right half => next, left half => previous
      const x = event.clientX;
      const midpoint = window.innerWidth / 2;
      stepImageModal(x < midpoint ? -1 : 1);
    });
  }

  window.addEventListener('keydown', (event) => {
    if (!imageModal || imageModal.hidden) return;
    if (event.key === 'Escape') closeImageModal();
    if (event.key === 'ArrowLeft') stepImageModal(-1);
    if (event.key === 'ArrowRight') stepImageModal(1);
  });

  window.addEventListener('popstate', () => {
    const placeId = getPlaceParamFromUrl();
    if (placeId) {
      focusPlace(placeId, { openPopup: true, updateUrl: false });
      return;
    }

    featuredPlaceId = null;
    renderFeaturedPlace();
    setStatus('');
  });

  [q, city, minRating, statusFilter].forEach((el) => el.addEventListener('input', render));
  retry.addEventListener('click', () => {
    loadPlaces().catch((error) => {
      setStatus(error.message || 'Error carregant les dades.', 'error');
      retry.hidden = false;
    });
  });

  await loadBuildInfo();

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
