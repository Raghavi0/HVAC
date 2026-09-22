from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

def now() -> datetime:
    return datetime.now(timezone.utc)

def identifier() -> str:
    import uuid
    return str(uuid.uuid4())

class Role(Base):
    __tablename__ = "roles"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    name: Mapped[str] = mapped_column(String(40), unique=True, index=True)

class Organization(Base):
    __tablename__ = "organizations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    name: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(40), default="EMPLOYEE", index=True)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class Building(Base):
    __tablename__ = "buildings"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(150))
    address: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(80))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class Floor(Base):
    __tablename__ = "floors"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    building_id: Mapped[str] = mapped_column(ForeignKey("buildings.id"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    floor_number: Mapped[int] = mapped_column(Integer)

class Room(Base):
    __tablename__ = "rooms"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    floor_id: Mapped[str] = mapped_column(ForeignKey("floors.id"), index=True)
    code: Mapped[str] = mapped_column(String(50), index=True)
    name: Mapped[str] = mapped_column(String(120))
    capacity: Mapped[int] = mapped_column(Integer, default=20)

class HVACUnit(Base):
    __tablename__ = "hvac_units"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    mode: Mapped[str] = mapped_column(String(30), default="SMART_AUTO")
    setpoint: Mapped[float] = mapped_column(Float, default=24.0)
    fan_speed: Mapped[int] = mapped_column(Integer, default=2)
    power: Mapped[float] = mapped_column(Float, default=0.0)
    health: Mapped[float] = mapped_column(Float, default=94.0)
    status: Mapped[str] = mapped_column(String(30), default="ONLINE")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)

class Sensor(Base):
    __tablename__ = "sensors"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), index=True)
    sensor_type: Mapped[str] = mapped_column(String(40))
    code: Mapped[str] = mapped_column(String(80), unique=True)
    status: Mapped[str] = mapped_column(String(30), default="ONLINE")
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    sensor_id: Mapped[str] = mapped_column(ForeignKey("sensors.id"), index=True)
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), index=True)
    metric: Mapped[str] = mapped_column(String(40), index=True)
    value: Mapped[float] = mapped_column(Float)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)

class EnergyReading(Base):
    __tablename__ = "energy_readings"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), index=True)
    power_kw: Mapped[float] = mapped_column(Float)
    energy_kwh: Mapped[float] = mapped_column(Float)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)

class OccupancyReading(Base):
    __tablename__ = "occupancy_readings"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), index=True)
    occupancy: Mapped[int] = mapped_column(Integer)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)

class HVACReading(Base):
    __tablename__ = "hvac_readings"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    hvac_unit_id: Mapped[str] = mapped_column(ForeignKey("hvac_units.id"), index=True)
    metric: Mapped[str] = mapped_column(String(40))
    value: Mapped[float] = mapped_column(Float)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, index=True)

class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    building_id: Mapped[str] = mapped_column(ForeignKey("buildings.id"), nullable=True, index=True)
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), nullable=True, index=True)
    hvac_unit_id: Mapped[str] = mapped_column(ForeignKey("hvac_units.id"), nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default="INFO")
    title: Mapped[str] = mapped_column(String(180))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="OPEN", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    hvac_unit_id: Mapped[str] = mapped_column(ForeignKey("hvac_units.id"), index=True)
    title: Mapped[str] = mapped_column(String(180))
    status: Mapped[str] = mapped_column(String(30), default="OPEN")
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

class ServiceRequest(Base):
    __tablename__ = "service_requests"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    problem: Mapped[str] = mapped_column(Text)
    priority: Mapped[str] = mapped_column(String(20), default="NORMAL")
    status: Mapped[str] = mapped_column(String(30), default="OPEN")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class HVACSchedule(Base):
    __tablename__ = "hvac_schedules"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    hvac_unit_id: Mapped[str] = mapped_column(ForeignKey("hvac_units.id"), index=True)
    day_of_week: Mapped[int] = mapped_column(Integer)
    start_time: Mapped[str] = mapped_column(String(5))
    end_time: Mapped[str] = mapped_column(String(5))
    target_mode: Mapped[str] = mapped_column(String(30), default="ECO")

class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(180))
    message: Mapped[str] = mapped_column(Text)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class AIInsight(Base):
    __tablename__ = "ai_insights"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    building_id: Mapped[str] = mapped_column(ForeignKey("buildings.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(180))
    content: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class EnergyBaseline(Base):
    __tablename__ = "energy_baselines"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), index=True)
    baseline_kwh: Mapped[float] = mapped_column(Float)
    period: Mapped[str] = mapped_column(String(30), default="DAILY")

class SystemSetting(Base):
    __tablename__ = "system_settings"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    key: Mapped[str] = mapped_column(String(100), unique=True)
    value: Mapped[str] = mapped_column(Text)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(120))
    entity_type: Mapped[str] = mapped_column(String(60))
    entity_id: Mapped[str] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
