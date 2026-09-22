# API overview

- `POST /api/auth/login` with `{email,password}` returns a JWT.
- `GET /api/auth/me` returns the authenticated user.
- `GET /api/dashboard` returns command-center metrics.
- `GET /api/buildings/locations` returns map-ready building health data.
- `GET /api/buildings/{id}/rooms` returns floor and room records.
- `GET /api/hvac` returns HVAC units.
- `POST /api/hvac/{id}/control` updates setpoint, mode, and fan speed.
- `GET /api/energy/summary` returns power, energy, tariff, and carbon estimates.
- `GET /api/alerts` and `POST /api/alerts/{id}/acknowledge` manage alerts.
- `POST /api/ai/chat` runs the data-backed AI service abstraction.
- `WS /ws/building/{building_id}` streams simulator and control events.

FastAPI publishes interactive docs at `/docs`.
