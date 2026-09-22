# SmartHVAC architecture

The backend is the source of truth. Buildings contain floors, rooms, HVAC units and sensors. Sensor, occupancy, energy and HVAC readings are persisted through SQLAlchemy. REST endpoints serve initial state; WebSocket broadcasts simulator and control updates; MQTT is an isolated adapter for future ESP32 devices.

The React client uses one API client and TanStack Query. Demo Mode uses the same API routes as live mode, so hardware can replace the simulator without changing page contracts. Google Maps remains the geographic layer; floor and room views are separate.
