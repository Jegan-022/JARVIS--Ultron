from typing import Any
from app.tools.base import BaseTool
from app.tools.system_tools import (
    GetSystemStatusTool,
    GetTimeTool,
    GetWeatherTool,
    SetReminderTool,
    OpenWebsiteTool,
    SearchWebTool,
    TakeScreenshotTool,
)
from app.tools.scene_tools import (
    ChangeSceneTool,
    RotateSceneTool,
    ZoomSceneTool,
    SelectObjectTool,
    ShowInformationTool,
)
from app.tools.device_tools import (
    ControlHomeDeviceTool,
    ControlESP32Tool,
    GetDeviceStatusTool,
)


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, BaseTool] = {}
        self._register_default_tools()

    def _register_default_tools(self) -> None:
        defaults: list[BaseTool] = [
            GetSystemStatusTool(),
            GetTimeTool(),
            GetWeatherTool(),
            SetReminderTool(),
            OpenWebsiteTool(),
            SearchWebTool(),
            TakeScreenshotTool(),
            ChangeSceneTool(),
            RotateSceneTool(),
            ZoomSceneTool(),
            SelectObjectTool(),
            ShowInformationTool(),
            ControlHomeDeviceTool(),
            ControlESP32Tool(),
            GetDeviceStatusTool(),
        ]
        for tool in defaults:
            self.register_tool(tool)

    def register_tool(self, tool: BaseTool) -> None:
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> BaseTool | None:
        return self._tools.get(name)

    def list_tools(self) -> list[str]:
        return list(self._tools.keys())

    def list_schemas(self) -> list[dict[str, Any]]:
        return [tool.to_schema() for tool in self._tools.values()]

    async def execute_tool(
        self,
        name: str,
        params: dict[str, Any],
        context: dict[str, Any] | None = None,
        confirmed: bool = False,
    ) -> dict[str, Any]:
        tool = self.get_tool(name)
        if not tool:
            return {
                "success": False,
                "error": f"Tool '{name}' is not registered in ULTRON whitelist.",
            }

        if tool.permission_level == "SENSITIVE" and not confirmed:
            return {
                "success": False,
                "requires_confirmation": True,
                "tool_name": name,
                "parameters": params,
                "message": f"Action '{name}' is flagged sensitive and requires operator confirmation.",
            }

        try:
            res = await tool.execute(params, context)
            return {"success": True, "tool": name, "result": res}
        except Exception as e:
            return {"success": False, "tool": name, "error": str(e)}


tool_registry = ToolRegistry()
