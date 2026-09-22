# Building Intelligence Map setup

## Google Maps

1. Create or select a Google Cloud project.
2. Enable **Maps JavaScript API**. The map uses the `maps` and `marker` libraries and loads the official Google Maps JavaScript API at runtime.
3. Enable billing for the project as required by Google Maps Platform.
4. Create an API key and restrict it to the application's allowed web origins. Restrict the key to the Maps JavaScript API.
5. Copy `.env.example` to `.env` and set:

```text
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY
```

The current static HTML build also accepts `window.SMART_HVAC_CONFIG.googleMapsApiKey` when a host injects runtime configuration. The key is never stored in source code.

## Building data

The map requests live locations from:

```text
GET /api/buildings/locations
```

Each item should include `id`, `name`, `latitude`, `longitude`, `temperature`, `humidity`, `occupancy`, `power`, `hvacHealth`, and `status` (`normal`, `warning`, or `critical`). Optional fields include `address`, `city`, `rooms`, `hvacUnits`, `activeUnits`, `capacity`, `energyToday`, and `energyStatus`.

When the API is unavailable, Demo Mode is enabled in the map page so the rest of the dashboard remains usable. Turn Demo Mode off to see the API failure state. Demo locations are held in `map.js` only as an explicit development fallback and are never used when live data is returned.

## Hosting note

This workspace is currently a static HTML application. A Vite host should expose `VITE_GOOGLE_MAPS_API_KEY` through `import.meta.env`; a non-Vite host can inject `window.SMART_HVAC_CONFIG` before `map.js`. The existing floor-plan/room monitoring surfaces remain separate from the geographic building map.
