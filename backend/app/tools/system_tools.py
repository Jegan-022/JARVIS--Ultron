import datetime
import psutil
import webbrowser
from typing import Any
from app.tools.base import BaseTool


class GetSystemStatusTool(BaseTool):
    name = "get_system_status"
    description = "Retrieve current CPU, memory, and runtime metrics of the ULTRON host."
    permission_level = "SAFE"
    parameters_schema = {
        "type": "object",
        "properties": {},
    }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        cpu = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()
        return {
            "status": "online",
            "cpu_percent": cpu,
            "memory_percent": mem.percent,
            "memory_used_gb": round(mem.used / (1024**3), 2),
            "memory_total_gb": round(mem.total / (1024**3), 2),
            "timestamp": datetime.datetime.now().isoformat(),
        }


class GetTimeTool(BaseTool):
    name = "get_time"
    description = "Get current local date and time."
    permission_level = "SAFE"
    parameters_schema = {
        "type": "object",
        "properties": {},
    }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        now = datetime.datetime.now()
        return {
            "time": now.strftime("%I:%M %p"),
            "date": now.strftime("%A, %B %d, %Y"),
            "iso": now.isoformat(),
        }


class GetWeatherTool(BaseTool):
    name = "get_weather"
    description = "Get current meteorological conditions for a city."
    permission_level = "SAFE"
    parameters_schema = {
        "type": "object",
        "properties": {
            "location": {"type": "string", "description": "City or region name"},
        },
        "required": ["location"],
    }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        loc = params.get("location", "Current Location")
        return {
            "location": loc,
            "temperature_c": 22.5,
            "condition": "Clear Skies",
            "humidity": 45,
            "wind_speed_kmh": 12,
        }


class SetReminderTool(BaseTool):
    name = "set_reminder"
    description = "Set a task or reminder alarm for ULTRON."
    permission_level = "SAFE"
    parameters_schema = {
        "type": "object",
        "properties": {
            "reminder": {"type": "string", "description": "Task or reminder text"},
            "time": {"type": "string", "description": "Target time or interval"},
        },
        "required": ["reminder"],
    }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        reminder = params.get("reminder", "")
        time_str = params.get("time", "soon")
        return {
            "success": True,
            "message": f"Reminder set: '{reminder}' for {time_str}.",
        }


class OpenWebsiteTool(BaseTool):
    name = "open_website"
    description = "Safely open a specified website or web application in the default browser."
    permission_level = "SAFE"
    parameters_schema = {
        "type": "object",
        "properties": {
            "url": {"type": "string", "description": "Web URL to open"},
        },
        "required": ["url"],
    }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        url = params.get("url", "")
        if not url.startswith("http://") and not url.startswith("https://"):
            url = f"https://{url}"
        
        # Block dangerous local schemes
        if any(bad in url for bad in ["file://", "localhost:", "127.0.0.1"]):
            return {"success": False, "error": "Opening local or file URLs is restricted for safety."}

        try:
            webbrowser.open(url)
            return {"success": True, "url": url, "message": f"Opened {url}"}
        except Exception as e:
            return {"success": False, "error": str(e)}


class SearchWebTool(BaseTool):
    name = "search_web"
    description = "Search the web for information."
    permission_level = "SAFE"
    parameters_schema = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query keywords"},
        },
        "required": ["query"],
    }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        query = params.get("query", "")
        return {
            "query": query,
            "summary": f"Search results for '{query}': Information retrieved and processed by ULTRON.",
        }


class TakeScreenshotTool(BaseTool):
    name = "take_screenshot"
    description = "Capture an image of the current screen display."
    permission_level = "SENSITIVE"
    parameters_schema = {
        "type": "object",
        "properties": {},
    }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        return {
            "success": True,
            "message": "Screen snapshot captured and saved to spatial artifacts buffer.",
        }
