import pytest
from app.devices.home_assistant import ha_client
from app.devices.mqtt import mqtt_bridge


@pytest.mark.asyncio
async def test_home_assistant_mock_service():
    res = await ha_client.call_service("light", "turn_on", "light.bedroom_light", brightness=200)
    assert res["success"] is True
    assert res["entity_id"] == "light.bedroom_light"


@pytest.mark.asyncio
async def test_mqtt_bridge_command_and_telemetry():
    res = mqtt_bridge.publish_device_command("light", "ON")
    assert res["success"] is True
    assert res["command"] == "ON"

    telemetry = mqtt_bridge.get_telemetry()
    assert "temperature" in telemetry
    assert "humidity" in telemetry
