from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel
from app.devices.home_assistant import ha_client
from app.devices.mqtt import mqtt_bridge

router = APIRouter(prefix="/devices", tags=["Devices & IoT"])


class DeviceControlRequest(BaseModel):
    device_id: str
    action: str = "turn_on"
    brightness: int | None = None


class ESP32CommandRequest(BaseModel):
    device: str
    action: str = "ON"


@router.get("/list")
async def list_devices() -> list[dict[str, Any]]:
    return [
        {"id": "light.bedroom_light", "name": "Bedroom Light", "state": "on", "type": "light"},
        {"id": "light.living_room", "name": "Living Room Ambient", "state": "off", "type": "light"},
        {"id": "switch.main_relay", "name": "Main AC Relay", "state": "on", "type": "switch"},
        {"id": "esp32.node_alpha", "name": "ESP32 Sensor Matrix", "state": "active", "type": "esp32"},
    ]


@router.post("/control")
async def control_device(req: DeviceControlRequest) -> dict[str, Any]:
    domain = "light" if "light" in req.device_id else "switch"
    extra = {}
    if req.brightness is not None:
        extra["brightness"] = req.brightness
    return await ha_client.call_service(domain, req.action, req.device_id, **extra)


@router.post("/esp32/command")
async def send_esp32_command(req: ESP32CommandRequest) -> dict[str, Any]:
    return mqtt_bridge.publish_device_command(req.device, req.action)


@router.get("/telemetry")
async def get_telemetry() -> dict[str, Any]:
    return mqtt_bridge.get_telemetry()
