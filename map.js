const mapElements = {
  page: document.querySelector('#building-map'),
  stage: document.querySelector('#mapStage'),
  map: document.querySelector('#googleMap'),
  fallback: document.querySelector('#fallbackMap'),
  fallbackMarkers: document.querySelector('#fallbackMarkers'),
  loading: document.querySelector('#mapLoading'),
  error: document.querySelector('#mapError'),
  status: document.querySelector('#mapDataStatus'),
  count: document.querySelector('#mapCountLabel'),
  search: document.querySelector('#buildingSearch'),
  selectedPanel: document.querySelector('#selectedBuildingPanel'),
  demoToggle: document.querySelector('#demoModeToggle'),
  mode: document.querySelector('#mapModeSelect')
};

const DEMO_BUILDINGS = [
  { id: 'BLD-001', name: 'SmartHVAC Building 01', address: '12 Anna Salai, Chennai', city: 'Chennai', latitude: 13.0827, longitude: 80.2707, rooms: 42, hvacUnits: 12, activeUnits: 9, occupancy: 186, capacity: 240, temperature: 25.4, humidity: 56, power: 8.4, energyToday: 82.4, hvacHealth: 94, status: 'normal', energyStatus: 'normal' },
  { id: 'BLD-002', name: 'SmartHVAC Building 02', address: '5 Mount Road, Chennai', city: 'Chennai', latitude: 13.0674, longitude: 80.2376, rooms: 28, hvacUnits: 8, activeUnits: 6, occupancy: 0, capacity: 140, temperature: 23.1, humidity: 49, power: 3.1, energyToday: 34.8, hvacHealth: 88, status: 'warning', energyStatus: 'normal' },
  { id: 'BLD-003', name: 'SmartHVAC Building 03', address: '38 Velachery Main Road, Chennai', city: 'Chennai', latitude: 12.9815, longitude: 80.218, rooms: 64, hvacUnits: 16, activeUnits: 12, occupancy: 312, capacity: 360, temperature: 27.8, humidity: 63, power: 15.7, energyToday: 146.2, hvacHealth: 62, status: 'critical', energyStatus: 'high' },
  { id: 'BLD-004', name: 'SmartHVAC Building 04', address: '2 OMR Link Road, Chennai', city: 'Chennai', latitude: 12.9352, longitude: 80.2446, rooms: 36, hvacUnits: 10, activeUnits: 10, occupancy: 92, capacity: 180, temperature: 24.2, humidity: 52, power: 6.2, energyToday: 61.5, hvacHealth: 97, status: 'normal', energyStatus: 'normal' }
];

const state = {
  buildings: [],
  visibleBuildings: [],
  selectedBuilding: null,
  map: null,
  infoWindow: null,
  markers: new Map(),
  clusterer: null,
  userMarker: null,
  userPosition: null,
  googleReady: false,
  visualMode: 'map',
  usingDemo: false
};

const mapsKey = window.SMART_HVAC_CONFIG?.googleMapsApiKey || import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';
const apiUrl = `${window.SMART_HVAC_CONFIG?.apiBaseUrl || ''}/api/buildings/locations`;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function normalizeBuilding(raw, index) {
  return {
    id: raw.id || `BLD-${String(index + 1).padStart(3, '0')}`,
    name: raw.name || `SmartHVAC Building ${String(index + 1).padStart(2, '0')}`,
    address: raw.address || raw.city || 'Managed location',
    city: raw.city || '',
    latitude: Number(raw.latitude),
    longitude: Number(raw.longitude),
    rooms: Number(raw.rooms ?? raw.roomCount ?? 0),
    hvacUnits: Number(raw.hvacUnits ?? raw.hvacUnitCount ?? 0),
    activeUnits: Number(raw.activeUnits ?? raw.hvacUnits ?? 0),
    occupancy: Number(raw.occupancy ?? 0),
    capacity: Number(raw.capacity ?? 0),
    temperature: Number(raw.temperature ?? 0),
    humidity: Number(raw.humidity ?? 0),
    power: Number(raw.power ?? 0),
    energyToday: Number(raw.energyToday ?? raw.energy ?? 0),
    hvacHealth: Number(raw.hvacHealth ?? raw.health ?? 0),
    status: ['normal', 'warning', 'critical'].includes(raw.status) ? raw.status : 'normal',
    energyStatus: raw.energyStatus === 'high' ? 'high' : 'normal'
  };
}

function setDataStatus(text, status = '') {
  mapElements.status.className = `map-data-status ${status}`;
  mapElements.status.innerHTML = `<i></i> ${text}`;
}

function setMapError(message) {
  mapElements.error.textContent = message;
  mapElements.error.hidden = false;
}

function clearMapError() {
  mapElements.error.hidden = true;
  mapElements.error.textContent = '';
}

async function loadBuildings() {
  setDataStatus('Loading building locations...');
  try {
    const response = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Locations request failed with ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload)) throw new Error('Locations response was not an array');
    state.buildings = payload.map(normalizeBuilding).filter((building) => Number.isFinite(building.latitude) && Number.isFinite(building.longitude));
    state.usingDemo = false;
    setDataStatus(`${state.buildings.length} live buildings`, 'ready');
    clearMapError();
  } catch (error) {
    if (!mapElements.demoToggle.checked) {
      state.buildings = [];
      setDataStatus('Building data unavailable', 'error');
      setMapError('Unable to load building data. Check the SmartHVAC API and try again.');
      renderBuildings();
      return;
    }
    state.buildings = DEMO_BUILDINGS.map(normalizeBuilding);
    state.usingDemo = true;
    setDataStatus('Demo Mode · 4 buildings', 'ready');
    setMapError('Live building data is unavailable. Showing demo buildings.');
  }
  renderBuildings();
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Unable to load ${url}`));
    document.head.appendChild(script);
  });
}

async function loadGoogleMaps() {
  if (!mapsKey) {
    state.googleReady = false;
    mapElements.loading.hidden = true;
    mapElements.map.hidden = true;
    mapElements.fallback.hidden = false;
    setMapError('Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY to .env to enable geographic building visualization.');
    return;
  }
  try {
    await loadScript(`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(mapsKey)}&v=weekly&libraries=marker`);
    await Promise.all([
      window.google.maps.importLibrary('maps'),
      window.google.maps.importLibrary('marker'),
      loadScript('https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js')
    ]);
    state.googleReady = true;
    mapElements.map.hidden = false;
    mapElements.fallback.hidden = true;
    mapElements.loading.hidden = true;
    clearMapError();
    initializeGoogleMap();
    renderBuildings();
  } catch (error) {
    state.googleReady = false;
    mapElements.loading.hidden = true;
    mapElements.map.hidden = true;
    mapElements.fallback.hidden = false;
    setMapError('Unable to load Google Maps. Please check your Google Maps API configuration.');
  }
}

function markerMetric(building) {
  if (state.visualMode === 'temperature') return `${building.temperature.toFixed(1)}°C`;
  if (state.visualMode === 'energy') return `${building.power.toFixed(1)} kW`;
  if (state.visualMode === 'occupancy') return `${building.occupancy} people`;
  if (state.visualMode === 'health') return `${building.hvacHealth}% health`;
  return `${building.hvacHealth}% health`;
}

function markerContent(building) {
  const wrapper = document.createElement('div');
  wrapper.className = `map-marker-content ${building.status}`;
  wrapper.setAttribute('aria-label', `${building.name}, ${building.status}`);
  wrapper.innerHTML = `<span class="map-marker-dot">●</span><span class="map-marker-label"><strong>${escapeHtml(building.name)}</strong><small>${escapeHtml(markerMetric(building))}</small></span>`;
  return wrapper;
}

function googleInfoContent(building) {
  const statusLabel = building.status[0].toUpperCase() + building.status.slice(1);
  return `<div class="google-info-window"><h3>${escapeHtml(building.name)}</h3><p>${escapeHtml(building.address)} · ${escapeHtml(building.id)}</p><div class="google-info-grid"><div><span>Temperature</span><strong>${building.temperature.toFixed(1)}°C</strong></div><div><span>Humidity</span><strong>${building.humidity}%</strong></div><div><span>Occupancy</span><strong>${building.occupancy}</strong></div><div><span>Power</span><strong>${building.power.toFixed(1)} kW</strong></div><div><span>HVAC health</span><strong>${building.hvacHealth}%</strong></div><div><span>HVAC units</span><strong>${building.hvacUnits}</strong></div></div><span class="google-info-status ${building.status}">● ${statusLabel} · CO₂ impact normal</span><div class="google-info-actions"><button data-map-action="dashboard" type="button">View dashboard</button><button data-map-action="floor" type="button">View floor map</button><button data-map-action="hvac" type="button">View HVAC</button></div></div>`;
}

function initializeGoogleMap() {
  const center = state.buildings[0] ? { lat: state.buildings[0].latitude, lng: state.buildings[0].longitude } : { lat: 13.0827, lng: 80.2707 };
  state.map = new google.maps.Map(mapElements.map, { center, zoom: 12, mapId: 'DEMO_MAP_ID', mapTypeId: 'roadmap', streetViewControl: true, fullscreenControl: true, mapTypeControl: true, zoomControl: true, gestureHandling: 'greedy' });
  state.infoWindow = new google.maps.InfoWindow();
  state.map.addListener('click', () => state.infoWindow.close());
}

function createGoogleMarkers() {
  const markerLibrary = google.maps.marker;
  state.markers.forEach((marker) => { marker.map = null; });
  state.markers.clear();
  if (state.clusterer) state.clusterer.clearMarkers();
  const visibleMarkers = state.visibleBuildings.map((building) => {
    const marker = new markerLibrary.AdvancedMarkerElement({ map: state.map, position: { lat: building.latitude, lng: building.longitude }, title: `${building.name} · ${building.status}`, content: markerContent(building) });
    marker.addListener('click', () => selectBuilding(building.id, true));
    state.markers.set(building.id, marker);
    return marker;
  });
  if (window.markerClusterer?.MarkerClusterer) {
    state.clusterer = new window.markerClusterer.MarkerClusterer({ map: state.map, markers: visibleMarkers });
  }
}

function renderFallbackMarkers() {
  mapElements.fallbackMarkers.innerHTML = state.visibleBuildings.map((building, index) => {
    const left = 18 + ((index * 29 + 12) % 70);
    const top = 27 + ((index * 31 + 9) % 56);
    const selected = state.selectedBuilding?.id === building.id ? ' selected' : '';
    return `<button class="map-marker ${building.status}${selected}" style="left:${left}%;top:${top}%" data-building-id="${escapeHtml(building.id)}" type="button" aria-label="${escapeHtml(building.name)}, ${building.status}"><span class="map-marker-pin"><span class="map-marker-dot">●</span><span class="map-marker-label"><strong>${escapeHtml(building.name)}</strong><small>${escapeHtml(markerMetric(building))}</small></span></span></button>`;
  }).join('');
  mapElements.fallbackMarkers.querySelectorAll('[data-building-id]').forEach((marker) => marker.addEventListener('click', () => selectBuilding(marker.dataset.buildingId, false)));
}

function renderBuildings() {
  const filtered = filterBuildings();
  state.visibleBuildings = filtered;
  mapElements.count.textContent = `${filtered.length} of ${state.buildings.length} buildings`;
  if (state.googleReady && state.map) createGoogleMarkers();
  else renderFallbackMarkers();
  if (state.selectedBuilding && !filtered.some((building) => building.id === state.selectedBuilding.id)) {
    state.selectedBuilding = null;
    renderSelectedBuilding();
  }
}

function getFilterValues(group) {
  return [...document.querySelectorAll(`.map-filter[data-filter-group="${group}"]:checked`)].map((input) => input.dataset.filterValue);
}

function filterBuildings() {
  const query = mapElements.search.value.trim().toLowerCase();
  const statuses = getFilterValues('status');
  const health = getFilterValues('health');
  const occupancy = getFilterValues('occupancy');
  const energy = getFilterValues('energy');
  return state.buildings.filter((building) => {
    const searchable = `${building.id} ${building.name} ${building.address} ${building.city}`.toLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (statuses.length && !statuses.includes(building.status)) return false;
    if (health.length && !health.some((value) => value === 'high' ? building.hvacHealth > 90 : value === 'medium' ? building.hvacHealth >= 70 && building.hvacHealth <= 90 : building.hvacHealth < 70)) return false;
    if (occupancy.length && !occupancy.includes(building.occupancy > 0 ? 'occupied' : 'empty')) return false;
    if (energy.length && !energy.includes(building.energyStatus)) return false;
    return true;
  });
}

function renderSelectedBuilding() {
  const building = state.selectedBuilding;
  if (!building) {
    mapElements.selectedPanel.innerHTML = '<div class="empty-selection"><span>⌖</span><strong>Select a building</strong><p>Choose a marker to inspect live environmental and HVAC status.</p></div>';
    return;
  }
  const healthColor = building.hvacHealth < 70 ? '#e47664' : building.hvacHealth < 91 ? '#e5ad56' : '#68bf80';
  mapElements.selectedPanel.innerHTML = `<div class="building-detail"><div class="building-detail-kicker"><span>${escapeHtml(building.id)}</span><span class="building-status ${building.status}">● ${building.status}</span></div><h2>${escapeHtml(building.name)}</h2><p class="building-address">⌖ ${escapeHtml(building.address)}</p><div class="building-metrics"><div class="building-metric"><span>Temperature</span><strong>${building.temperature.toFixed(1)}°C</strong><small>${building.humidity}% humidity</small></div><div class="building-metric"><span>Occupancy</span><strong>${building.occupancy}</strong><small>${building.rooms} rooms</small></div><div class="building-metric"><span>Power</span><strong>${building.power.toFixed(1)} kW</strong><small>${building.energyToday.toFixed(1)} kWh today</small></div><div class="building-metric"><span>HVAC units</span><strong>${building.activeUnits}/${building.hvacUnits}</strong><small>active now</small></div></div><div class="building-health"><div class="building-health-head"><span>HVAC health</span><strong>${building.hvacHealth}%</strong></div><div class="health-bar"><i style="width:${building.hvacHealth}%;background:${healthColor}"></i></div></div><div class="building-detail-actions"><button data-panel-action="dashboard" type="button">Open building dashboard</button><button data-panel-action="floor" type="button">Floor map</button><button data-panel-action="energy" type="button">Energy</button><button data-panel-action="alerts" type="button">Alerts</button></div></div>`;
  mapElements.selectedPanel.querySelectorAll('[data-panel-action]').forEach((button) => button.addEventListener('click', () => handleMapAction(button.dataset.panelAction, building)));
}

function selectBuilding(id, openInfo) {
  const building = state.buildings.find((item) => item.id === id);
  if (!building) return;
  state.selectedBuilding = building;
  renderSelectedBuilding();
  renderBuildings();
  if (state.googleReady && state.map) {
    state.map.panTo({ lat: building.latitude, lng: building.longitude });
    state.map.setZoom(Math.max(state.map.getZoom(), 15));
    if (openInfo) {
      state.infoWindow.setContent(googleInfoContent(building));
      state.infoWindow.open({ map: state.map, anchor: state.markers.get(building.id) });
      window.setTimeout(() => document.querySelectorAll('[data-map-action]').forEach((button) => button.addEventListener('click', () => handleMapAction(button.dataset.mapAction, building))), 0);
    }
  }
  renderFallbackMarkers();
}

function navigateTo(target) {
  document.querySelector(`.nav-item[data-target="${target}"]`)?.click();
}

function handleMapAction(action, building) {
  state.infoWindow?.close();
  if (action === 'dashboard') navigateTo('page-heading');
  if (action === 'floor') navigateTo('lower-grid');
  if (action === 'hvac') navigateTo('realtime-grid');
  if (action === 'energy') navigateTo('metric-grid');
  if (action === 'alerts') navigateTo('insight-grid');
  if (building) selectBuilding(building.id, false);
}

function resetFilters() {
  document.querySelectorAll('.map-filter').forEach((input) => { input.checked = input.dataset.filterGroup === 'status'; });
  mapElements.search.value = '';
  renderBuildings();
}

function applyMapMode() {
  state.visualMode = mapElements.mode.value;
  if (state.googleReady && state.map && ['map', 'satellite', 'hybrid'].includes(state.visualMode)) state.map.setMapTypeId(state.visualMode === 'map' ? 'roadmap' : state.visualMode);
  mapElements.stage.dataset.view = state.visualMode;
  renderBuildings();
}

function haversineDistance(from, to) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const earthRadius = 6371;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function showNearestBuildings(position) {
  const nearby = [...state.buildings].sort((a, b) => haversineDistance(position, a) - haversineDistance(position, b)).slice(0, 3);
  let list = document.querySelector('#nearestBuildings');
  if (!list) {
    list = document.createElement('div');
    list.id = 'nearestBuildings';
    list.className = 'nearest-buildings';
    mapElements.selectedPanel.parentElement.insertBefore(list, mapElements.selectedPanel);
  }
  list.innerHTML = `<div class="map-panel-heading"><div><span class="section-kicker">NEARBY BUILDINGS</span><strong>Closest to you</strong></div><button class="filter-reset" type="button" id="hideNearest">Hide</button></div>${nearby.map((building) => `<button type="button" data-nearest-id="${escapeHtml(building.id)}"><span><strong>${escapeHtml(building.name.replace('SmartHVAC ', ''))}</strong><small>${building.status} · ${building.hvacHealth}% health</small></span><b>${haversineDistance(position, building).toFixed(1)} km</b></button>`).join('')}`;
  list.querySelector('#hideNearest').addEventListener('click', () => list.remove());
  list.querySelectorAll('[data-nearest-id]').forEach((button) => button.addEventListener('click', () => selectBuilding(button.dataset.nearestId, true)));
}

function locateUser() {
  if (!navigator.geolocation) {
    setMapError('This browser does not support location services.');
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    state.userPosition = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    if (state.googleReady && state.map) {
      state.map.panTo({ lat: state.userPosition.latitude, lng: state.userPosition.longitude });
      state.map.setZoom(14);
      const markerLibrary = google.maps.marker;
      state.userMarker?.map && (state.userMarker.map = null);
      state.userMarker = new markerLibrary.AdvancedMarkerElement({ map: state.map, position: { lat: state.userPosition.latitude, lng: state.userPosition.longitude }, title: 'Your location', content: Object.assign(document.createElement('div'), { className: 'user-location-marker', textContent: '●' }) });
    }
    showNearestBuildings(state.userPosition);
  }, () => setMapError('Location permission was not granted. Your location was not collected.'));
}

function bindMapEvents() {
  document.querySelectorAll('.map-filter').forEach((input) => input.addEventListener('change', renderBuildings));
  document.querySelector('#resetMapFilters').addEventListener('click', resetFilters);
  mapElements.search.addEventListener('input', renderBuildings);
  mapElements.search.addEventListener('search', () => { if (state.visibleBuildings[0]) selectBuilding(state.visibleBuildings[0].id, true); });
  mapElements.mode.addEventListener('change', applyMapMode);
  mapElements.demoToggle.addEventListener('change', loadBuildings);
  document.querySelector('#myLocationButton').addEventListener('click', locateUser);
  document.querySelector('#nearestBuildingButton').addEventListener('click', locateUser);
  document.querySelector('#mapZoomIn').addEventListener('click', () => state.map?.setZoom(state.map.getZoom() + 1));
  document.querySelector('#mapZoomOut').addEventListener('click', () => state.map?.setZoom(state.map.getZoom() - 1));
  document.querySelector('#mapFitBounds').addEventListener('click', () => {
    if (!state.map || !state.visibleBuildings.length) return;
    const bounds = new google.maps.LatLngBounds();
    state.visibleBuildings.forEach((building) => bounds.extend({ lat: building.latitude, lng: building.longitude }));
    state.map.fitBounds(bounds, 70);
  });
}

bindMapEvents();
loadBuildings();
loadGoogleMaps();
