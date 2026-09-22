class MQTTService:
    """MQTT-ready boundary. Real brokers can be enabled without changing API routes."""
    def __init__(self, broker: str, port: int):
        self.broker = broker
        self.port = port
        self.connected = False

    def connect(self) -> None:
        self.connected = False

    def publish_hvac_command(self, room_code: str, payload: dict) -> bool:
        return self.connected

    def subscribe_sensor_topics(self) -> list[str]:
        return ["hvac/+/temperature", "hvac/+/humidity", "hvac/+/airquality", "hvac/+/occupancy", "hvac/+/energy", "hvac/+/status"]
