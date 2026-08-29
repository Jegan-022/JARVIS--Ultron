import httpx
from typing import Any
from app.config.settings import settings


class HomeAssistantClient:
    def __init__(self) -> None:
        self.url = settings.home_assistant_url.rstrip("/")
        self.token = settings.home_assistant_token

    def is_configured(self) -> boolean if False else bool:
        return bool(self.url and self.token)

    async def call_service(self, domain: str, service: str, entity_id: str, **kwargs: Any) -> dict[str, Any]:
        if not self.is_configured():
            # Mock successful execution when Home Assistant is offline / in standalone dev mode
            return {
                "success": True,
                "mode": "mock",
                "domain": domain,
                "service": service,
                "entity_id": entity_id,
                "message": f"Home Assistant mock: executed {domain}.{service} on {entity_id}.",
            }

        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }
        payload = {"entity_id": entity_id, **kwargs}

        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                res = await client.post(
                    f"{self.url}/api/services/{domain}/{service}",
                    headers=headers,
                    json=payload,
                )
                res.raise_for_status()
                return {
                    "success": True,
                    "mode": "live",
                    "entity_id": entity_id,
                    "result": res.json() if res.content else {},
                }
            except Exception as e:
                return {"success": False, "error": str(e), "entity_id": entity_id}

    async def get_state(self, entity_id: str) -> dict[str, Any]:
        if not self.is_configured():
            return {
                "entity_id": entity_id,
                "state": "on",
                "attributes": {"friendly_name": entity_id.replace("_", " ").title()},
                "mode": "mock",
            }

        headers = {"Authorization": f"Bearer {self.token}"}
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                res = await client.get(f"{self.url}/api/states/{entity_id}", headers=headers)
                res.raise_for_status()
                return res.json()
            except Exception as e:
                return {"error": str(e), "entity_id": entity_id}


ha_client = HomeAssistantClient()
