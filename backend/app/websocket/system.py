import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.api.system import collect_system_status
from app.devices.mqtt import mqtt_bridge

router = APIRouter()


@router.websocket("/ws/system")
async def system_socket(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            status_payload = collect_system_status()
            telemetry = mqtt_bridge.get_telemetry()
            payload = {
                **status_payload,
                "sensor_data": telemetry,
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(1.5)
    except WebSocketDisconnect:
        return
    except Exception:
        return
