from typing import Any
from app.tools.base import BaseTool
from app.devices.home_assistant import ha_client
from app.devices.mqtt import mqtt_bridge


class ControlHomeDeviceTool(BaseTool):
    name = "control_home_device"
    description = "Control a smart home light, switch, or device via Home Assistant."
    permission_level = "SAFE"
    parameters_schema = {
        "type": "object",
        "properties": {
            "device": {
                "type": "string",
                "description": "Device name or entity_id (e.g. 'bedroom_light', 'living_room_light', 'switch.fan')",
            },
            "action": {
                "type": "string",
                "enum": ["turn_on", "turn_off", "toggle"],
                "description": "Action to perform on the device",
            },
            "brightness": {
                "type": "integer",
                "description": "Optional brightness level (0 to 255)",
            },
        },
        "required": ["device", "action"],
    }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        device = params.get("device", "light.bedroom_light")
        action = params.get("action", "turn_on")
        brightness = params.get("brightness")

        # Determine domain
        if "." in device:
            domain, entity_name = device.split(".", 1)
        else:
            domain = "light"
            device = f"light.{device}"

        extra = {}
        if brightness is not None and domain == "light":
            extra["brightness"] = brightness

        result = await ha_client.call_service(domain, action, device, **extra)
        return {
            "success": True,
            "device": device,
            "action": action,
            "ha_result": result,
            "message": f"Executed {action} for {device}.",
        }


class ControlESP32Tool(BaseTool):
    name = "control_esp32"
    description = "Send a low-level hardware control command to an ESP32 microcontroller node over MQTT."
    permission_level = "SAFE"
    parameters_schema = {
        "type": "object",
        "properties": {
            "device": {
                "type": "string",
                "description": "ESP32 peripheral (e.g., 'light', 'fan', 'relay_1')",
            },
            "action": {
                "type": "string",
                "enum": ["ON", "OFF", "STATUS"],
                "description": "Hardware command",
            },
        },
        "required": ["device", "action"],
    }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        device = params.get("device", "light")
        action = params.get("action", "ON")
        res = mqtt_bridge.publish_device_command(device, action)
        return {
            "success": True,
            "device": device,
            "action": action,
            "mqtt": res,
            "message": f"ESP32 command '{action}' transmitted to peripheral '{device}'.",
        }


class GetDeviceStatusTool(BaseTool):
    name = "get_device_status"
    description = "Query the current state and telemetry of smart home devices or ESP32 sensors."
    permission_level = "SAFE"
    parameters_schema = {
        "type": "object",
        "properties": {
            "device_id": {
                "type": "string",
                "description": "Entity ID or sensor name",
            }
        },
        "required": ["device_id"],
    }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        device_id = params.get("device_id", "sensor.temperature")
        if "sensor" in device_id or "esp32" in device_id:
            telemetry = mqtt_bridge.get_telemetry()
            return {
                "device_id": device_id,
                "telemetry": telemetry,
                "message": f"Telemetry retrieved: {telemetry.get('temperature', 24.5)}°C, {telemetry.get('humidity', 48)}% humidity.",
            }
        state = await ha_client.get_state(device_id)
        return {"device_id": device_id, "state": state}
