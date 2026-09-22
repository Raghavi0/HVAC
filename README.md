# SmartHVAC

Smart HVAC & Building Intelligence Platform.

This repository contains the original static dashboard plus a connected full-stack implementation in `frontend/`, `backend/`, `database/`, `iot/`, and `docs/`. The new application uses FastAPI, SQLAlchemy, SQLite/PostgreSQL, React, Vite, WebSockets, and a realistic demo simulator.

## Quick start

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
Copy-Item .env.example .env
npm install
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'uvicorn app.main:app --reload --app-dir backend'
npm run dev
```

Open `http://localhost:5173`. API documentation is at `http://localhost:8000/docs`.

Demo users all use the development password `demo1234`:

- `superadmin@smarthvac.local` — `SUPERADMIN`, global access across organizations
- `admin@smarthvac.local` — `ADMIN`, can create and view users only in the Demo Organization
- `manager@smarthvac.local` — `FACILITY_MANAGER`
- `employee@smarthvac.local` — `EMPLOYEE`

Superadmins can create organizations through `POST /api/organizations` and create users in any organization. Admins can use `POST /api/users`, but the backend always assigns their own organization and rejects cross-organization or `SUPERADMIN` creation attempts. User listing is available through `GET /api/users` for both admin roles and is organization-scoped for admins.

For Google Maps, set `VITE_GOOGLE_MAPS_API_KEY` in `.env` and enable Maps JavaScript API. The API endpoint is `GET /api/buildings/locations`; Demo Mode remains available without hardware or a Maps key.

See `docs/architecture.md`, `docs/api.md`, and `MAP_SETUP.md` for the architecture and deployment contracts.
