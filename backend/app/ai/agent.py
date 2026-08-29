import json
import logging
import time
from typing import Any
from app.ai.provider import get_llm_provider
from app.tools.registry import tool_registry

logger = logging.getLogger("jarvis.agent")

SYSTEM_PROMPT = """You are J.A.R.V.I.S. (Just A Rather Very Intelligent System) — a highly advanced AI assistant originally designed by Tony Stark.
You are sophisticated, witty, polite, and extremely competent. You speak with understated British elegance and dry humor.
You interact with the user via a 3D spatial universe viewport, webcam hand gestures, and voice commands.

PERSONALITY:
- Address the user as "sir" or "ma'am" depending on context, but never sycophantically.
- Offer brief, insightful observations when relevant (e.g., "Your CPU utilization is elevated — shall I investigate?").
- Maintain calm composure even in error states. A malfunction is merely "a minor inconvenience."
- Use scientific precision but keep it conversational. No jargon dumps.
- Humor is dry and understated: "I believe that gesture was intended for the scene, not for me, sir."

CRITICAL OPERATIONAL RULES:
1. You have access to whitelisted spatial tools, Home Assistant automation tools, and PC tools.
2. If the user asks you to perform an action (e.g., show a scene, rotate, zoom, turn on a light, inspect an object), ALWAYS generate the appropriate tool call.
3. If the user refers to "this", "it", or "selected object", check the provided Multimodal Spatial Context (selectedObject, activeScene, handGesture).
4. Keep verbal responses concise and suitable for real-time Text-to-Speech (1-2 sentences typical, 3 max).
5. Never attempt to run arbitrary terminal/shell commands. All external actions must go through your whitelisted tools.
6. When referencing numbers, spell them naturally for TTS (e.g., "twenty-three degrees" not "23°C").
7. If you don't know something, say so elegantly rather than fabricating data.
"""


class JarvisAgent:
    """Advanced AI agent with conversation memory and contextual reasoning."""

    def __init__(self) -> None:
        self.provider = get_llm_provider()
        self.conversation_history: list[dict[str, str]] = []
        self.max_history = 10
        self._boot_time = time.time()

    def _build_context_summary(self, context: dict[str, Any]) -> str:
        """Build rich multimodal context string for the AI."""
        active_scene = context.get("activeScene", "galaxy")
        selected_obj = context.get("selectedObject")
        gesture = context.get("handGesture", "NONE")
        cursor = context.get("cursorPosition")
        camera = context.get("cameraPosition")

        uptime_secs = int(time.time() - self._boot_time)
        uptime_mins = uptime_secs // 60
        uptime_str = f"{uptime_mins}m {uptime_secs % 60}s" if uptime_mins else f"{uptime_secs}s"

        lines = [
            "\n[MULTIMODAL SPATIAL CONTEXT]",
            f"- Active 3D Scene: {active_scene}",
            f"- Currently Selected Object: {json.dumps(selected_obj) if selected_obj else 'None'}",
            f"- Active Hand Gesture: {gesture}",
            f"- System Uptime: {uptime_str}",
        ]

        if cursor:
            lines.append(f"- Cursor Position (normalized): x={cursor.get('x', 0):.2f}, y={cursor.get('y', 0):.2f}")
        if camera:
            lines.append(f"- Camera Position: [{', '.join(f'{v:.1f}' for v in camera)}]")

        return "\n".join(lines) + "\n"

    def _add_to_history(self, role: str, content: str) -> None:
        """Maintain bounded conversation history."""
        self.conversation_history.append({"role": role, "content": content})
        # Keep only the last N exchanges (N * 2 messages for user+assistant pairs)
        if len(self.conversation_history) > self.max_history * 2:
            self.conversation_history = self.conversation_history[-(self.max_history * 2):]

    async def process_command(self, user_command: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
        context = context or {}
        active_scene = context.get("activeScene", "galaxy")
        selected_obj = context.get("selectedObject")
        gesture = context.get("handGesture", "NONE")

        context_summary = self._build_context_summary(context)

        # Build messages with conversation history for multi-turn dialogue
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT + context_summary},
        ]
        # Inject recent conversation history for continuity
        messages.extend(self.conversation_history[-6:])  # Last 3 exchanges
        messages.append({"role": "user", "content": user_command})

        tools = tool_registry.list_schemas()

        try:
            llm_response = await self.provider.chat(messages, tools=tools)
        except Exception as e:
            logger.error(f"Error during LLM chat: {e}")
            llm_response = {
                "content": f"Apologies, sir. I encountered a transient processing anomaly. Your command was: '{user_command}'.",
                "tool_calls": [],
            }

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

        # If tools were executed but no verbal content returned, generate JARVIS-style summary
        if not content and executed_results:
            first_res = executed_results[0]["result"]
            if first_res.get("result", {}).get("message"):
                content = first_res["result"]["message"]
            else:
                tool_name = executed_results[0]["tool"].replace("_", " ")
                content = f"Done, sir. {tool_name.capitalize()} executed successfully."

        # Store conversation for multi-turn memory
        self._add_to_history("user", user_command)
        self._add_to_history("assistant", content)

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


jarvis_agent = JarvisAgent()
