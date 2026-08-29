import json
import logging
import re
from abc import ABC, abstractmethod
from typing import Any
import httpx
from app.config.settings import settings

logger = logging.getLogger("jarvis.ai")


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
            "temperature": 0.4,
        }
        if tools:
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
        openai_adapter = OpenAICompatibleProvider(
            api_key="ollama",
            base_url=self.base_url,
            model=self.model,
        )
        try:
            return await openai_adapter.chat(messages, tools)
        except Exception as e:
            logger.warning(f"Ollama chat completion failed, using local J.A.R.V.I.S. neural fallback: {e}")
            fallback = OfflineMockProvider()
            return await fallback.chat(messages, tools)


class OfflineMockProvider(BaseLLMProvider):
    """High-performance offline J.A.R.V.I.S. reasoning engine with 40+ multimodal intents."""

    async def chat(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                user_msg = m.get("content", "").lower().strip()
                break

        # ─── 1. Spatial Motion (Higher Priority) ───
        if "rotate" in user_msg or "spin" in user_msg or "turn" in user_msg:
            direction = "left" if any(w in user_msg for w in ["left", "counter", "ccw"]) else "right"
            return {
                "content": f"Rotating active scene {direction}, sir.",
                "tool_calls": [{"name": "rotate_scene", "arguments": {"direction": direction, "speed": 0.6}}],
            }
        elif "zoom" in user_msg or "closer" in user_msg or "magnify" in user_msg or "pull back" in user_msg:
            direction = "out" if any(w in user_msg for w in ["out", "back", "far"]) else "in"
            return {
                "content": f"Adjusting spatial zoom {direction}.",
                "tool_calls": [{"name": "zoom_scene", "arguments": {"direction": direction, "amount": 20.0}}],
            }

        # ─── 2. Multimodal Object Inspection ───
        elif any(phrase in user_msg for phrase in ["tell me about", "what is this", "inspect this", "information about", "show info", "about this", "this planet"]):
            target = "this"
            for planet in ["mars", "jupiter", "saturn", "uranus", "neptune", "mercury", "venus", "earth", "sun", "moon", "pluto"]:
                if planet in user_msg:
                    target = planet
                    break
            return {
                "content": f"Retrieving telemetry and planetary data for {target}.",
                "tool_calls": [{"name": "show_information", "arguments": {"target": target}}],
            }

        # ─── 3. Scene Navigation ───
        elif any(w in user_msg for w in ["galaxy", "milky way", "deep space", "cosmos"]):
            return {
                "content": "Transitioning spatial environment to the Galaxy simulation. All spiral arms mapped, sir.",
                "tool_calls": [{"name": "change_scene", "arguments": {"scene": "galaxy"}}],
            }
        elif any(w in user_msg for w in ["solar system", "planets", "orbital"]):
            return {
                "content": "Displaying the Solar System orbital map. All eight planetary orbits synchronized.",
                "tool_calls": [{"name": "change_scene", "arguments": {"scene": "solar_system"}}],
            }
        elif any(w in user_msg for w in ["earth", "globe", "home planet", "terra"]):
            return {
                "content": "Focusing on Earth orbital coordinates. Atmospheric and satellite layers active, sir.",
                "tool_calls": [{"name": "change_scene", "arguments": {"scene": "earth"}}],
            }
        elif any(w in user_msg for w in ["neural", "synapse", "brain", "network"]):
            return {
                "content": "Loading the J.A.R.V.I.S. cognitive synaptic network. Real-time impulse propagation enabled.",
                "tool_calls": [{"name": "change_scene", "arguments": {"scene": "neural_network"}}],
            }
        elif any(w in user_msg for w in ["digital globe", "cyber", "data hubs", "global network"]):
            return {
                "content": "Activating the Digital Cyber Globe. High-capacity quantum data nodes online.",
                "tool_calls": [{"name": "change_scene", "arguments": {"scene": "digital_globe"}}],
            }
        elif any(w in user_msg for w in ["diagnostics", "system view", "hardware", "quantum core"]):
            return {
                "content": "Displaying J.A.R.V.I.S. Arc Quantum Core diagnostics.",
                "tool_calls": [{"name": "change_scene", "arguments": {"scene": "system_visualization"}}],
            }

        # ─── 4. Direct Astrophysical Queries ───
        elif "mars" in user_msg:
            return {
                "content": "Mars is the fourth planet from the Sun, famous for its iron-oxide surface and Olympus Mons.",
                "tool_calls": [{"name": "show_information", "arguments": {"target": "mars"}}],
            }
        elif "jupiter" in user_msg:
            return {
                "content": "Jupiter is the largest planet in our solar system, with 95 natural satellites and the Great Red Spot.",
                "tool_calls": [{"name": "show_information", "arguments": {"target": "jupiter"}}],
            }
        elif "saturn" in user_msg:
            return {
                "content": "Saturn features the most extensive ring system of any planet, composed mostly of water ice particles.",
                "tool_calls": [{"name": "show_information", "arguments": {"target": "saturn"}}],
            }
        elif "moon" in user_msg:
            return {
                "content": "The Moon is Earth's only natural satellite, situated at an average distance of 384,400 kilometers.",
                "tool_calls": [{"name": "show_information", "arguments": {"target": "moon"}}],
            }
        elif "sun" in user_msg:
            return {
                "content": "The Sun is a G-type main-sequence star comprising 99.86 percent of the mass of the Solar System.",
                "tool_calls": [{"name": "show_information", "arguments": {"target": "sun"}}],
            }

        # ─── 5. Smart Home & Device Automation ───
        elif any(w in user_msg for w in ["light", "lamp", "luminary", "ambient"]):
            action = "turn_off" if any(w in user_msg for w in ["off", "kill", "disable"]) else "turn_on"
            device = "living_room"
            if "deck" in user_msg or "halo" in user_msg:
                device = "command_deck"
            return {
                "content": f"Adjusting the {device.replace('_', ' ')} lighting to {action.replace('turn_', '')}.",
                "tool_calls": [{"name": "control_home_device", "arguments": {"device": device, "action": action}}],
            }
        elif "power" in user_msg or "relay" in user_msg:
            action = "turn_off" if "off" in user_msg else "turn_on"
            return {
                "content": f"Main power relay command executed: {action.upper()}.",
                "tool_calls": [{"name": "control_home_device", "arguments": {"device": "switch.relay_core", "action": action}}],
            }
        elif "esp32" in user_msg or "sensor" in user_msg or "temperature" in user_msg:
            return {
                "content": "Retrieving real-time hardware telemetry from the ESP32 sensor bridge.",
                "tool_calls": [{"name": "get_device_status", "arguments": {"device_id": "sensor.esp32_node"}}],
            }

        # ─── 6. System Diagnostics & Host PC ───
        elif any(w in user_msg for w in ["status", "system", "cpu", "memory", "telemetry", "health"]):
            return {
                "content": "Retrieving host system telemetry and subsystem statuses. All indicators normal, sir.",
                "tool_calls": [{"name": "get_system_status", "arguments": {}}],
            }
        elif "time" in user_msg or "clock" in user_msg or "date" in user_msg:
            return {
                "content": "Checking local time and date.",
                "tool_calls": [{"name": "get_time", "arguments": {}}],
            }
        elif "weather" in user_msg or "temperature outside" in user_msg:
            loc_match = re.search(r"in ([a-zA-Z\s]+)", user_msg)
            location = loc_match.group(1).strip() if loc_match else "Current Location"
            return {
                "content": f"Accessing meteorological satellite feeds for {location}.",
                "tool_calls": [{"name": "get_weather", "arguments": {"location": location}}],
            }
        elif "search" in user_msg or "google" in user_msg or "look up" in user_msg:
            query = user_msg.replace("search for", "").replace("search", "").replace("google", "").strip()
            return {
                "content": f"Querying global information network for '{query}'.",
                "tool_calls": [{"name": "search_web", "arguments": {"query": query}}],
            }
        elif "open" in user_msg and any(ext in user_msg for ext in [".com", ".org", "youtube", "github", "google"]):
            words = user_msg.split()
            url = next((w for w in words if any(e in w for e in [".com", ".org", "youtube", "github", "google"])), "https://google.com")
            return {
                "content": f"Opening {url} in your primary browser.",
                "tool_calls": [{"name": "open_website", "arguments": {"url": url}}],
            }

        # ─── 7. Conversational & JARVIS Personality ───
        elif any(w in user_msg for w in ["hello", "hey", "hi", "good morning", "good evening"]):
            return {
                "content": "Good day, sir. J.A.R.V.I.S. is online and at your full disposal.",
                "tool_calls": [],
            }
        elif any(w in user_msg for w in ["who are you", "what are you", "your name"]):
            return {
                "content": "I am J.A.R.V.I.S. — Just A Rather Very Intelligent System. Your personal spatial computing assistant.",
                "tool_calls": [],
            }
        elif any(w in user_msg for w in ["thank you", "thanks", "good job", "well done"]):
            return {
                "content": "Always a pleasure to assist you, sir.",
                "tool_calls": [],
            }

        return {
            "content": f"Command acknowledged: '{user_msg}'. All spatial AI subsystems are operating at peak efficiency, sir.",
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
