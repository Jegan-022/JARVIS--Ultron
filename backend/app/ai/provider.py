import json
import logging
from abc import ABC, abstractmethod
from typing import Any
import httpx
from app.config.settings import settings

logger = logging.getLogger("ultron.ai")


class BaseLLMProvider(ABC):
    @abstractmethod
    async def chat(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Send chat messages and tool definitions to the LLM."""
        pass


class OpenAICompatibleProvider(BaseLLMProvider):
    def __init__(self, api_key: str, base_url: str, model: str) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def chat(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3,
        }
        if tools:
            # Format as OpenAI functions/tools
            payload["tools"] = [
                {
                    "type": "function",
                    "function": {
                        "name": t["name"],
                        "description": t["description"],
                        "parameters": t["parameters"],
                    },
                }
                for t in tools
            ]

        async with httpx.AsyncClient(timeout=25.0) as client:
            res = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            res.raise_for_status()
            data = res.json()
            choice = data["choices"][0]["message"]
            
            tool_calls = []
            if "tool_calls" in choice and choice["tool_calls"]:
                for tc in choice["tool_calls"]:
                    fn = tc.get("function", {})
                    args = fn.get("arguments", "{}")
                    try:
                        parsed_args = json.loads(args) if isinstance(args, str) else args
                    except Exception:
                        parsed_args = {}
                    tool_calls.append({"name": fn.get("name"), "arguments": parsed_args})

            return {
                "content": choice.get("content", ""),
                "tool_calls": tool_calls,
            }


class OllamaProvider(BaseLLMProvider):
    def __init__(self, base_url: str, model: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def chat(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        # Try OpenAI-compatible endpoint of Ollama first (/v1/chat/completions)
        openai_adapter = OpenAICompatibleProvider(
            api_key="ollama",
            base_url=self.base_url,
            model=self.model,
        )
        try:
            return await openai_adapter.chat(messages, tools)
        except Exception as e:
            logger.warning(f"Ollama chat completion failed, using local offline fallback: {e}")
            fallback = OfflineMockProvider()
            return await fallback.chat(messages, tools)


class OfflineMockProvider(BaseLLMProvider):
    """Zero-dependency offline provider capable of parsing common ULTRON commands locally."""

    async def chat(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                user_msg = m.get("content", "").lower()
                break

        # Fast offline intent matching
        if "rotate" in user_msg:
            direction = "left" if "left" in user_msg else "right"
            return {
                "content": f"Rotating active scene {direction}.",
                "tool_calls": [{"name": "rotate_scene", "arguments": {"direction": direction, "speed": 0.5}}],
            }
        elif "zoom" in user_msg:
            direction = "out" if "out" in user_msg else "in"
            return {
                "content": f"Adjusting spatial zoom {direction}.",
                "tool_calls": [{"name": "zoom_scene", "arguments": {"direction": direction, "amount": 15.0}}],
            }
        elif "earth" in user_msg or "planet" in user_msg:
            return {
                "content": "Planet Earth is the third orbital world from the Sun and the primary cradle of human civilization.",
                "tool_calls": [{"name": "show_information", "arguments": {"target": "earth"}}],
            }
        elif "solar system" in user_msg:
            return {
                "content": "Switching to Solar System orbital map.",
                "tool_calls": [{"name": "change_scene", "arguments": {"scene": "solar_system"}}],
            }
        elif "light" in user_msg or "lamp" in user_msg:
            action = "turn_off" if "off" in user_msg else "turn_on"
            return {
                "content": f"Turning {action.replace('turn_', '')} the room light.",
                "tool_calls": [{"name": "control_home_device", "arguments": {"device": "bedroom_light", "action": action}}],
            }
        elif "status" in user_msg or "system" in user_msg:
            return {
                "content": "Retrieving real-time host telemetry and spatial subsystem status.",
                "tool_calls": [{"name": "get_system_status", "arguments": {}}],
            }
        elif "time" in user_msg:
            return {
                "content": "Checking local clock.",
                "tool_calls": [{"name": "get_time", "arguments": {}}],
            }

        return {
            "content": f"Command received: '{user_msg}'. Spatial computing systems operational.",
            "tool_calls": [],
        }


def get_llm_provider() -> BaseLLMProvider:
    if settings.llm_api_key and settings.llm_provider in ["openai", "groq", "anthropic"]:
        return OpenAICompatibleProvider(
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url,
            model=settings.llm_model,
        )
    elif settings.llm_provider == "ollama":
        return OllamaProvider(
            base_url=settings.llm_base_url,
            model=settings.llm_model,
        )
    return OfflineMockProvider()
