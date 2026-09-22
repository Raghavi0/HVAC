import asyncio
import random
from datetime import datetime, timezone
from sqlalchemy import select
from .database import SessionLocal
from .models import HVACUnit, Sensor, SensorReading

class DemoSimulator:
    def __init__(self, publish):
        self.publish = publish
        self.running = True

    async def run(self):
        while self.running:
            with SessionLocal() as db:
                units = db.scalars(select(HVACUnit).limit(30)).all()
                for unit in units:
                    drift = random.uniform(-0.12, 0.12)
                    unit.power = max(0, round(1.2 + unit.fan_speed * .35 + drift, 2)) if unit.mode != "OFF" else 0
                    unit.updated_at = datetime.now(timezone.utc)
                db.commit()
                await self.publish({"type": "telemetry", "units": [{"id": u.id, "code": u.code, "power": u.power, "mode": u.mode, "health": u.health} for u in units]})
            await asyncio.sleep(5)
