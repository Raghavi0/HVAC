import asyncio
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, Header, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from .ai_service import AIService
from .config import settings
from .database import Base, SessionLocal, engine, get_db, migrate_organization_columns
from .models import Alert, Building, Floor, HVACUnit, Organization, Room, Sensor, SensorReading, User
from .mqtt_service import MQTTService
from .schemas import AlertOut, ChatRequest, HVACControlRequest, LoginRequest, OrganizationCreate, OrganizationOut, TokenResponse, UserCreate, UserOut
from .security import create_access_token, decode_subject, hash_password, verify_password
from .seed import seed_database
from .simulator import DemoSimulator

clients: set[WebSocket] = set()
mqtt = MQTTService(settings.mqtt_broker, settings.mqtt_port)

async def broadcast(payload: dict) -> None:
    for client in list(clients):
        try:
            await client.send_json(payload)
        except Exception:
            clients.discard(client)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    migrate_organization_columns()
    with SessionLocal() as db:
        seed_database(db)
    simulator = DemoSimulator(broadcast) if settings.demo_mode else None
    task = asyncio.create_task(simulator.run()) if simulator else None
    yield
    if simulator:
        simulator.running = False
    if task:
        task.cancel()

app = FastAPI(title="SmartHVAC API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def current_user(db: Session = Depends(get_db), authorization: str | None = Header(default=None)) -> User:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        user_id = decode_subject(authorization.removeprefix("Bearer "))
    except JWTError as error:
        raise HTTPException(status_code=401, detail="Invalid authentication token") from error
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User is inactive")
    return user

@app.get("/health")
def health():
    return {"status": "ok", "demo_mode": settings.demo_mode}

@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"access_token": create_access_token(user.id), "user": user}

@app.get("/api/auth/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user

def require_role(*roles: str):
    def dependency(user: User = Depends(current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return dependency

@app.get("/api/organizations", response_model=list[OrganizationOut])
def organizations(user: User = Depends(require_role("SUPERADMIN")), db: Session = Depends(get_db)):
    return db.scalars(select(Organization).order_by(Organization.name)).all()

@app.post("/api/organizations", response_model=OrganizationOut, status_code=201)
def create_organization(payload: OrganizationCreate, user: User = Depends(require_role("SUPERADMIN")), db: Session = Depends(get_db)):
    if db.scalar(select(Organization).where((Organization.slug == payload.slug) | (Organization.name == payload.name))):
        raise HTTPException(status_code=409, detail="Organization already exists")
    organization = Organization(name=payload.name, slug=payload.slug)
    db.add(organization); db.commit(); db.refresh(organization)
    return organization

@app.get("/api/users", response_model=list[UserOut])
def users(user: User = Depends(require_role("SUPERADMIN", "ADMIN")), db: Session = Depends(get_db)):
    query = select(User).order_by(User.name)
    if user.role != "SUPERADMIN":
        query = query.where(User.organization_id == user.organization_id)
    return db.scalars(query).all()

@app.post("/api/users", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate, actor: User = Depends(require_role("SUPERADMIN", "ADMIN")), db: Session = Depends(get_db)):
    requested_role = payload.role.upper()
    allowed_roles = {"ADMIN", "FACILITY_MANAGER", "EMPLOYEE"}
    if requested_role not in allowed_roles:
        raise HTTPException(status_code=422, detail="Only ADMIN, FACILITY_MANAGER, or EMPLOYEE users can be created")
    organization_id = payload.organization_id if actor.role == "SUPERADMIN" else actor.organization_id
    if not organization_id or not db.get(Organization, organization_id):
        raise HTTPException(status_code=422, detail="A valid organization is required")
    if actor.role == "ADMIN" and payload.organization_id and payload.organization_id != actor.organization_id:
        raise HTTPException(status_code=403, detail="Admins can create users only in their own organization")
    if db.scalar(select(User).where(User.email == payload.email.lower())):
        raise HTTPException(status_code=409, detail="Email is already registered")
    new_user = User(email=payload.email.lower(), name=payload.name, role=requested_role, organization_id=organization_id, password_hash=hash_password(payload.password))
    db.add(new_user); db.commit(); db.refresh(new_user)
    return new_user

@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)):
    buildings = db.scalars(select(Building)).all()
    units = db.scalars(select(HVACUnit)).all()
    alerts = db.scalar(select(func.count(Alert.id)).where(Alert.status == "OPEN")) or 0
    return {"temperature": round(23.8 + len(buildings) * .2, 1), "humidity": 56, "air_quality": "Good", "occupancy": 498, "power": round(sum(unit.power for unit in units), 1), "energy_saved": 14.8, "hvac_health": round(sum(unit.health for unit in units) / len(units), 1) if units else 0, "open_alerts": alerts, "buildings": len(buildings)}

@app.get("/api/buildings/locations")
def building_locations(db: Session = Depends(get_db)):
    buildings = db.scalars(select(Building)).all()
    result = []
    for building in buildings:
        rooms = db.scalars(select(Room).join(Floor, Room.floor_id == Floor.id).where(Floor.building_id == building.id)).all()
        room_ids = [room.id for room in rooms]
        units = db.scalars(select(HVACUnit).where(HVACUnit.room_id.in_(room_ids))).all() if room_ids else []
        occupancy = sum(10 for room in rooms if int(room.code[-1]) % 3 != 0)
        health = round(sum(unit.health for unit in units) / len(units), 1) if units else 0
        result.append({"id": building.code, "name": building.name, "address": building.address, "city": building.city, "latitude": building.latitude, "longitude": building.longitude, "rooms": len(rooms), "hvacUnits": len(units), "activeUnits": sum(unit.mode != "OFF" for unit in units), "occupancy": occupancy, "temperature": round(23.5 + (100 - health) / 20, 1), "humidity": 56, "power": round(sum(unit.power for unit in units), 1), "energyToday": round(sum(unit.power for unit in units) * 8.6, 1), "hvacHealth": health, "status": "critical" if health < 70 else "warning" if health < 90 else "normal"})
    return result

@app.get("/api/buildings")
def buildings(db: Session = Depends(get_db)):
    return [{"id": building.id, "code": building.code, "name": building.name, "address": building.address, "city": building.city, "latitude": building.latitude, "longitude": building.longitude, "organization_id": building.organization_id} for building in db.scalars(select(Building).order_by(Building.name)).all()]

@app.get("/api/environment")
def environment(building_code: str | None = None, db: Session = Depends(get_db)):
    query = select(SensorReading, Room, Floor, Building).join(Room, SensorReading.room_id == Room.id).join(Floor, Room.floor_id == Floor.id).join(Building, Floor.building_id == Building.id).where(SensorReading.metric.in_(["temperature", "humidity"]))
    if building_code:
        query = query.where(Building.code == building_code)
    rows = db.execute(query.order_by(SensorReading.recorded_at.desc()).limit(120)).all()
    latest_by_room: dict[tuple[str, str], dict] = {}
    for reading, room, floor, building in rows:
        key = (room.id, reading.metric)
        latest_by_room.setdefault(key, {"room": room.name, "room_code": room.code, "floor": floor.name, "building": building.name, "building_code": building.code, "temperature": None, "humidity": None, "recorded_at": reading.recorded_at})
        latest_by_room[key][reading.metric] = round(reading.value, 1)
    rooms: dict[str, dict] = {}
    for item in latest_by_room.values():
        rooms.setdefault(item["room_code"], {key: item[key] for key in ("room", "room_code", "floor", "building", "building_code", "recorded_at")})
        if item["temperature"] is not None: rooms[item["room_code"]]["temperature"] = item["temperature"]
        if item["humidity"] is not None: rooms[item["room_code"]]["humidity"] = item["humidity"]
    return list(rooms.values())

@app.get("/api/buildings/{building_id}/rooms")
def building_rooms(building_id: str, db: Session = Depends(get_db)):
    building = db.scalar(select(Building).where((Building.id == building_id) | (Building.code == building_id)))
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    return db.execute(select(Room, Floor).join(Floor, Room.floor_id == Floor.id).where(Floor.building_id == building.id)).all()

@app.get("/api/hvac")
def hvac_units(db: Session = Depends(get_db)):
    return db.scalars(select(HVACUnit)).all()

@app.get("/api/sensors")
def sensors(db: Session = Depends(get_db)):
    sensor_rows = db.execute(select(Sensor, Room, Floor, Building).join(Room, Sensor.room_id == Room.id).join(Floor, Room.floor_id == Floor.id).join(Building, Floor.building_id == Building.id)).all()
    result = []
    for sensor, room, floor, building in sensor_rows:
        latest = db.scalar(select(SensorReading).where(SensorReading.sensor_id == sensor.id).order_by(SensorReading.recorded_at.desc()).limit(1))
        result.append({"id": sensor.id, "code": sensor.code, "type": sensor.sensor_type, "status": sensor.status, "last_seen": sensor.last_seen, "room": room.name, "room_code": room.code, "floor": floor.name, "building": building.name, "building_code": building.code, "latest_value": latest.value if latest else None, "latest_metric": latest.metric if latest else sensor.sensor_type, "recorded_at": latest.recorded_at if latest else sensor.last_seen})
    return result

@app.post("/api/hvac/{unit_id}/control")
async def control_hvac(unit_id: str, payload: HVACControlRequest, db: Session = Depends(get_db)):
    unit = db.get(HVACUnit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="HVAC unit not found")
    if payload.setpoint is not None: unit.setpoint = payload.setpoint
    if payload.mode is not None:
        allowed = {"SMART_AUTO", "COOL", "HEAT", "FAN", "ECO", "OFF"}
        if payload.mode not in allowed: raise HTTPException(status_code=422, detail="Unsupported HVAC mode")
        unit.mode = payload.mode
    if payload.fan_speed is not None: unit.fan_speed = payload.fan_speed
    db.commit(); db.refresh(unit)
    await broadcast({"type": "hvac_control", "unit": {"id": unit.id, "code": unit.code, "setpoint": unit.setpoint, "mode": unit.mode, "fan_speed": unit.fan_speed, "power": unit.power}})
    return unit

@app.get("/api/alerts", response_model=list[AlertOut])
def alerts(db: Session = Depends(get_db)):
    return db.scalars(select(Alert).order_by(Alert.created_at.desc())).all()

@app.post("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if not alert: raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "ACKNOWLEDGED"; db.commit(); return alert

@app.get("/api/energy/summary")
def energy_summary(db: Session = Depends(get_db)):
    units = db.scalars(select(HVACUnit)).all()
    current = round(sum(unit.power for unit in units), 2)
    return {"current_power_kw": current, "today_kwh": round(current * 8.6, 2), "week_kwh": round(current * 8.6 * 7, 2), "month_kwh": round(current * 8.6 * 30, 2), "tariff": 8.0, "estimated_daily_cost": round(current * 8.6 * 8, 2), "carbon_factor": 0.82, "estimated_carbon_kg": round(current * 8.6 * .82, 2)}

@app.post("/api/ai/chat")
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    return AIService().answer(db, payload.message)

@app.websocket("/ws/building/{building_id}")
async def building_socket(websocket: WebSocket, building_id: str):
    await websocket.accept(); clients.add(websocket)
    try:
        await websocket.send_json({"type": "connected", "building_id": building_id})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients.discard(websocket)
