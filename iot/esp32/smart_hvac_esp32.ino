#include <WiFi.h>
#include <PubSubClient.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_HOST = "192.168.1.10";
const int MQTT_PORT = 1883;
const int TEMP_SENSOR_PIN = 34;
const int OCCUPANCY_PIN = 27;

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

void connectWifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
}

void connectMqtt() {
  while (!mqtt.connected()) {
    if (mqtt.connect("smarthvac-esp32-room-204")) {
      mqtt.subscribe("hvac/room-204/status");
    } else { delay(2000); }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(OCCUPANCY_PIN, INPUT);
  connectWifi();
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWifi();
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();
  float temperature = 23.5f + (analogRead(TEMP_SENSOR_PIN) / 4095.0f) * 5.0f;
  int occupancy = digitalRead(OCCUPANCY_PIN) ? 1 : 0;
  char payload[128];
  snprintf(payload, sizeof(payload), "{\"temperature\":%.1f,\"occupancy\":%d}", temperature, occupancy);
  mqtt.publish("hvac/room-204/temperature", payload);
  mqtt.publish("hvac/room-204/occupancy", payload);
  delay(5000);
}
