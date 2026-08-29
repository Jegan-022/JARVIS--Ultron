import json
import logging
from typing import Any
import paho.mqtt.client as mqtt
from app.config.settings import settings

logger = logging.getLogger("ultron.mqtt")


class MQTTBridge:
    def __init__(self) -> None:
        self.client: mqtt.Client | None = None
        self.connected = False
        self.latest_sensor_data: dict[str, Any] = {
            "temperature": 24.5,
            "humidity": 48.0,
            "motion": False,
            "last_updated": 0,
        }

    def start(self) -> None:
        try:
            self.client = mqtt.Client()
            if settings.mqtt_username:
                self.client.username_pw_set(settings.mqtt_username, settings.mqtt_password)

            self.client.on_connect = self._on_connect
            self.client.on_message = self._on_message
            self.client.connect_async(settings.mqtt_host, settings.mqtt_port, 60)
            self.client.loop_start()
        except Exception as e:
            logger.warning(f"MQTT Broker offline or unreachable at {settings.mqtt_host}:{settings.mqtt_port}: {e}")
            self.connected = False

    def _on_connect(self, client: mqtt.Client, userdata: Any, flags: Any, rc: int) -> None:
        if rc == 0:
            self.connected = True
            logger.info("Connected to MQTT Broker.")
            client.subscribe(f"{settings.mqtt_topic_prefix}/sensor/#")
        else:
            self.connected = False
            logger.warning(f"MQTT connection failed with code {rc}")

    def _on_message(self, client: mqtt.Client, userdata: Any, msg: mqtt.MQTTMessage) -> None:
        try:
            topic = msg.topic
            payload_str = msg.payload.decode("utf-8")
            if "temperature" in topic:
                self.latest_sensor_data["temperature"] = float(payload_str)
            elif "humidity" in topic:
                self.latest_sensor_data["humidity"] = float(payload_str)
            else:
                try:
                    data = json.loads(payload_str)
                    if isinstance(data, dict):
                        self.latest_sensor_data.update(data)
                except Exception:
                    pass
        except Exception as e:
            logger.error(f"Error parsing MQTT message: {e}")

    def publish_device_command(self, device: str, action: str) -> dict[str, Any]:
        topic = f"{settings.mqtt_topic_prefix}/device/{device}"
        payload = action.upper()
        if self.connected and self.client:
            self.client.publish(topic, payload)
            return {"success": True, "topic": topic, "command": payload, "mode": "live"}
        return {
            "success": True,
            "topic": topic,
            "command": payload,
            "mode": "mock",
            "message": f"MQTT mock published '{payload}' to '{topic}'.",
        }

    def get_telemetry(self) -> dict[str, Any]:
        return self.latest_sensor_data


mqtt_bridge = MQTTBridge()
