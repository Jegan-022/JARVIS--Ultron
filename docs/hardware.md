# ULTRON Hardware & IoT Integration

ULTRON supports external microcontrollers (ESP32, ESP8266, Raspberry Pi) and Home Assistant smart home devices via MQTT and REST.

## MQTT Topic Architecture

```
Prefix: ultron/

Topics:
- ultron/device/<device_name>    [PUB/SUB]  Commands sent to peripherals (e.g. ON, OFF)
- ultron/sensor/temperature      [PUB]      Temperature telemetry (°C)
- ultron/sensor/humidity         [PUB]      Relative humidity percentage (%)
- ultron/sensor/motion           [PUB]      PIR sensor state (1 / 0)
```

## ESP32 Sample Firmware (Arduino / C++)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "192.168.1.100"; // IP of ULTRON host

WiFiClient espClient;
PubSubClient client(espClient);

const int RELAY_PIN = 23;

void callback(char* topic, byte* message, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) {
    msg += (char)message[i];
  }
  if (msg == "ON") {
    digitalWrite(RELAY_PIN, HIGH);
  } else if (msg == "OFF") {
    digitalWrite(RELAY_PIN, LOW);
  }
}

void setup() {
  pinMode(RELAY_PIN, OUTPUT);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    while (!client.connected()) {
      if (client.connect("ULTRON_ESP32_NODE")) {
        client.subscribe("ultron/device/light");
      } else {
        delay(2000);
      }
    }
  }
  client.loop();

  // Publish sensor data every 5 seconds
  static unsigned long lastPub = 0;
  if (millis() - lastPub > 5000) {
    lastPub = millis();
    float temp = 24.5 + (random(-10, 10) / 10.0);
    client.publish("ultron/sensor/temperature", String(temp).c_str());
  }
}
```

## Home Assistant Integration

ULTRON interfaces with Home Assistant via Long-Lived Access Tokens:
1. Generate a token in **Home Assistant > Profile > Long-Lived Access Tokens**.
2. Add `HOME_ASSISTANT_URL` and `HOME_ASSISTANT_TOKEN` to `backend/.env`.
3. Say: *"Ultron, turn on the living room light"* or use the HUD Devices panel.
