const q = document.getElementById('q');
const city = document.getElementById('city');
const category = document.getElementById('category');
const list = document.getElementById('list');
const count = document.getElementById('count');

let places = [];
let map;
let markers = [];

function uniq(values){return [...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ca'))}

function fillFilters(){
  for(const c of uniq(places.map(p=>p.city))){
    const o=document.createElement('option');o.value=c;o.textContent=c;city.appendChild(o);
  }
  for(const c of uniq(places.map(p=>p.category))){
    const o=document.createElement('option');o.value=c;o.textContent=c;category.appendChild(o);
  }
}

function matches(p){
  const text=(q.value||'').trim().toLowerCase();
  const hay=[p.name,p.city,p.category,(p.tags||[]).join(' '),p.notes||''].join(' ').toLowerCase();
  if(text && !hay.includes(text)) return false;
  if(city.value && p.city!==city.value) return false;
  if(category.value && p.category!==category.value) return false;
  return true;
}

function card(p){
  const el=document.createElement('article');
  el.className='card';
  el.innerHTML=`
    <h3>${p.name}</h3>
    <div class="meta">${p.city || '-'} · ${p.category || '-'}</div>
    <div class="meta">${p.lat ?? '-'}, ${p.lng ?? '-'}</div>
    <div class="links"><a href="${p.mapsUrl}" target="_blank" rel="noopener">Obrir a Google Maps ↗</a></div>
    ${p.notes?`<p>${p.notes}</p>`:''}
    <div class="tags">${(p.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join('')}</div>
  `;
  return el;
}

function initMap(){
  map = L.map('map').setView([41.9831, 2.8249], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

function renderMap(filtered){
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const withCoords = filtered.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  withCoords.forEach(p => {
    const marker = L.marker([p.lat, p.lng]).addTo(map);
    marker.bindPopup(`<strong>${p.name}</strong><br>${p.city || ''}<br><a href="${p.mapsUrl}" target="_blank">Google Maps</a>`);
    markers.push(marker);
  });

  if(withCoords.length){
    const bounds = L.latLngBounds(withCoords.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [20,20], maxZoom: 15 });
  }
}

function render(){
  const filtered = places.filter(matches);
  count.textContent = `${filtered.length} llocs`;
  list.innerHTML='';
  filtered.forEach(p=>list.appendChild(card(p)));
  renderMap(filtered);
}

async function init(){
  const res = await fetch('places.json');
  places = await res.json();
  initMap();
  fillFilters();
  [q, city, category].forEach(el=>el.addEventListener('input', render));
  render();
}

init();
