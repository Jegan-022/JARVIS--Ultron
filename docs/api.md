# ULTRON REST & WebSocket API Specification

## 1. System Endpoints

### `GET /health`
Returns ULTRON Core operational health status.

### `GET /api/system/status`
Returns host CPU, memory, network state, and timestamp.

### `WS /ws/system`
Real-time continuous WebSocket stream broadcasting host performance metrics and ESP32 sensor telemetry.

---

## 2. AI & Multimodal Command Endpoints

### `POST /api/ai/command`
Executes natural-language or voice queries within the current 3D spatial context.

**Request Body**:
```json
{
  "command": "tell me about this planet",
  "activeScene": "solar_system",
  "selectedObject": {
    "id": "earth",
    "name": "Earth",
    "type": "planet"
  },
  "handGesture": "PINCH",
  "cameraPosition": [0, 8, 42]
}
```

**Response**:
```json
{
  "text": "Planet Earth is the third orbital world from the Sun.",
  "spoken_response": "Planet Earth is the third orbital world from the Sun.",
  "tool_executed": "show_information",
  "tool_results": [...]
}
```

### `GET /api/ai/tools`
Returns the JSON Schema of all registered whitelisted tools.

### `POST /api/ai/tools/execute`
Directly invokes a whitelisted tool by name.

---

## 3. IoT & Smart Home Endpoints

### `GET /api/devices/list`
Lists known Home Assistant entities and ESP32 peripheral nodes.

### `POST /api/devices/control`
Executes an action (`turn_on`, `turn_off`, `toggle`) on a smart light or switch.

### `POST /api/devices/esp32/command`
Transmits an MQTT command (`ON`, `OFF`, `STATUS`) to an ESP32 hardware topic.

### `GET /api/devices/telemetry`
Returns the latest temperature, humidity, and motion sensor readings.
