from typing import Any
from app.tools.base import BaseTool

SCENE_METADATA: dict[str, dict[str, Any]] = {
    "earth": {
        "id": "earth",
        "name": "Earth",
        "type": "planet",
        "description": "Third planet from the Sun and the only astronomical object known to harbor life. Radius: 6,371 km. Atmosphere: 78% Nitrogen, 21% Oxygen.",
        "orbital_period": "365.25 days",
        "satellites": ["Moon", "ISS"],
    },
    "mars": {
        "id": "mars",
        "name": "Mars",
        "type": "planet",
        "description": "The fourth planet from the Sun. Known as the Red Planet due to iron oxide on its surface. Atmosphere: 95% Carbon Dioxide.",
        "orbital_period": "687 days",
    },
    "sun": {
        "id": "sun",
        "name": "The Sun",
        "type": "star",
        "description": "G-type main-sequence star at the center of the Solar System. Accounts for 99.86% of the system's total mass.",
    },
    "jupiter": {
        "id": "jupiter",
        "name": "Jupiter",
        "type": "planet",
        "description": "Fifth planet from the Sun and largest in the Solar System. Known for its Great Red Spot and prominent magnetic field.",
    },
    "saturn": {
        "id": "saturn",
        "name": "Saturn",
        "type": "planet",
        "description": "Sixth planet from the Sun with prominent icy ring systems composed of countless dust and rock particles.",
    },
    "core": {
        "id": "core",
        "name": "Galactic Core",
        "type": "core",
        "description": "Supermassive luminous gravitational epicenter of the ULTRON galaxy visualization matrix.",
    },
}


class ChangeSceneTool(BaseTool):
    name = "change_scene"
    description = "Switch the active 3D visualization scene."
    permission_level = "SAFE"
    parameters_schema = {
        "type": "object",
        "properties": {
            "scene": {
                "type": "string",
                "enum": [
                    "galaxy",
                    "solar_system",
                    "earth",
                    "neural_network",
                    "digital_globe",
                    "system_visualization",
                ],
                "description": "Target scene identifier",
            }
        },
        "required": ["scene"],
    }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        target = params.get("scene", "galaxy")
        return {
            "success": True,
            "scene": target,
            "message": f"Transitioned spatial environment to {target}.",
        }


class RotateSceneTool(BaseTool):
    name = "rotate_scene"
    description = "Rotate the active 3D scene in a specified direction."
    permission_level = "SAFE"
    parameters_schema = {
        "type": "object",
        "properties": {
            "direction": {
                "type": "string",
                "enum": ["left", "right", "up", "down"],
                "description": "Rotation direction",
            },
            "speed": {
                "type": "number",
                "description": "Rotation intensity or speed factor (0.1 to 2.0)",
            },
        },
        "required": ["direction"],
    }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        direction = params.get("direction", "right")
        speed = params.get("speed", 0.5)
        return {
            "success": True,
            "direction": direction,
            "speed": speed,
            "message": f"Scene rotated {direction} with speed {speed}.",
        }


class ZoomSceneTool(BaseTool):
    name = "zoom_scene"
    description = "Zoom the 3D camera into or out from the active visualization."
    permission_level = "SAFE"
    parameters_schema = {
        "type": "object",
        "properties": {
            "direction": {
                "type": "string",
                "enum": ["in", "out"],
                "description": "Zoom direction",
            },
            "amount": {
                "type": "number",
                "description": "Zoom delta amount",
            },
        },
        "required": ["direction"],
    }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        direction = params.get("direction", "in")
        amount = params.get("amount", 10.0)
        return {
            "success": True,
            "direction": direction,
            "amount": amount,
            "message": f"Zoomed {direction} by {amount} units.",
        }


class SelectObjectTool(BaseTool):
    name = "select_object"
    description = "Select an interactive 3D object in the current scene."
    permission_level = "SAFE"
    parameters_schema = {
        "type": "object",
        "properties": {
            "object_id": {
                "type": "string",
                "description": "ID or name of the object to select",
            }
        },
        "required": ["object_id"],
    }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        obj_id = params.get("object_id", "").lower().strip()
        info = SCENE_METADATA.get(obj_id, {"id": obj_id, "name": obj_id.capitalize(), "type": "object"})
        return {
            "success": True,
            "object_id": obj_id,
            "object_details": info,
            "message": f"Selected {info.get('name', obj_id)} in 3D universe.",
        }


class ShowInformationTool(BaseTool):
    name = "show_information"
    description = "Retrieve detailed scientific or operational information about an object or the currently selected object."
    permission_level = "SAFE"
    parameters_schema = {
        "type": "object",
        "properties": {
            "target": {
                "type": "string",
                "description": "Target object name or 'selected' to inspect currently selected object",
            }
        },
    }

    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        target = params.get("target", "").lower().strip()

        # Check if user says "this" or "selected" and check context
        if not target or target in ["this", "selected", "current"]:
            if context and context.get("selectedObject"):
                target = context["selectedObject"].get("id", "earth").lower()
            else:
                target = "earth"

        info = SCENE_METADATA.get(
            target,
            {
                "id": target,
                "name": target.capitalize(),
                "type": "entity",
                "description": f"Spatial node '{target}' actively analyzed by ULTRON.",
            },
        )

        return {
            "success": True,
            "target": target,
            "information": info,
            "message": f"Retrieved information for {info.get('name', target)}: {info.get('description', '')}",
        }
