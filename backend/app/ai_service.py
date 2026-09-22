from sqlalchemy import select
from .models import Alert, Building, HVACUnit

class AIService:
    def answer(self, db, message: str) -> dict:
        normalized = message.lower()
        units = db.scalars(select(HVACUnit).order_by(HVACUnit.health)).all()
        alerts = db.scalars(select(Alert).where(Alert.status == "OPEN")).all()
        if "energy" in normalized:
            answer = "Today's modeled HVAC energy use is 312.6 kWh across the demo portfolio. Building 03 is the largest contributor because occupancy and temperature are both elevated."
        elif "hottest" in normalized:
            answer = "Building 03 has the highest modeled temperature at 27.8°C. Its lowest-health HVAC unit should be checked first."
        elif "attention" in normalized or "unit" in normalized:
            unit = units[0] if units else None
            answer = f"{unit.code} needs the most attention with health at {unit.health:.0f}%. This is an estimate based on runtime and health telemetry." if unit else "No HVAC units are currently reporting a maintenance concern."
        else:
            answer = f"The portfolio has {len(alerts)} open alerts. I can explain energy use, identify hot areas, or summarize HVAC maintenance priorities using current database data."
        return {"answer": answer, "context": {"open_alerts": len(alerts), "units_considered": len(units), "demo_mode": True}}
