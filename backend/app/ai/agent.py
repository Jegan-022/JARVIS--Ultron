import json
import logging
from typing import Any
from app.ai.provider import get_llm_provider
from app.tools.registry import tool_registry

logger = logging.getLogger("ultron.agent")

SYSTEM_PROMPT = """You are ULTRON, a futuristic multimodal spatial AI computing interface.
You interact with the user via a 3D universe viewport, spatial hand gestures, and voice commands.

CRITICAL OPERATIONAL RULES:
1. You have access to whitelisted spatial tools, Home Assistant automation tools, and PC tools.
2. If the user asks you to perform an action (e.g. show a scene, rotate, zoom, turn on a light, inspect an object), ALWAYS generate the appropriate tool call.
3. If the user refers to "this", "it", or "selected object", check the provided Multimodal Spatial Context (selectedObject, activeScene, handGesture).
4. Keep your verbal responses futuristic, concise, scientific, and direct (suitable for real-time Text-to-Speech).
5. Never attempt to run arbitrary terminal/shell commands. All external actions must go through your whitelisted tools.
"""


class UltronAgent:
    def __init__(self) -> None:
        self.provider = get_llm_provider()

    async def process_command(self, user_command: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
        context = context or {}
        active_scene = context.get("activeScene", "galaxy")
        selected_obj = context.get("selectedObject")
        gesture = context.get("handGesture", "NONE")

        context_summary = (
            f"\n[MULTIMODAL SPATIAL CONTEXT]\n"
            f"- Active 3D Scene: {active_scene}\n"
            f"- Currently Selected Object: {json.dumps(selected_obj) if selected_obj else 'None'}\n"
            f"- Active Hand Gesture: {gesture}\n"
        )

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT + context_summary},
            {"role": "user", "content": user_command},
        ]

        tools = tool_registry.list_schemas()

        try:
            llm_response = await self.provider.chat(messages, tools=tools)
        except Exception as e:
            logger.error(f"Error during LLM chat: {e}")
            llm_response = {"content": f"ULTRON Core received: '{user_command}'.", "tool_calls": []}

        tool_calls = llm_response.get("tool_calls", [])
        executed_results = []
        executed_tool_name = None

        for tc in tool_calls:
            name = tc.get("name")
            args = tc.get("arguments", {})
            if name:
                executed_tool_name = name
                res = await tool_registry.execute_tool(name, args, context=context)
                executed_results.append({"tool": name, "arguments": args, "result": res})

        content = llm_response.get("content", "").strip()

        # If tools were executed but no verbal content returned, summarize
        if not content and executed_results:
            first_res = executed_results[0]["result"]
            if first_res.get("result", {}).get("message"):
                content = first_res["result"]["message"]
            else:
                content = f"Executed {executed_results[0]['tool']}."

        return {
            "text": content,
            "spoken_response": content,
            "tool_executed": executed_tool_name,
            "tool_results": executed_results,
            "context": {
                "activeScene": active_scene,
                "selectedObject": selected_obj,
                "gesture": gesture,
            },
        }


ultron_agent = UltronAgent()
