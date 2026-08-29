from abc import ABC, abstractmethod
from typing import Any, Literal

PermissionLevel = Literal["SAFE", "SENSITIVE"]


class BaseTool(ABC):
    name: str
    description: str
    permission_level: PermissionLevel = "SAFE"
    parameters_schema: dict[str, Any]

    @abstractmethod
    async def execute(self, params: dict[str, Any], context: dict[str, Any] | None = None) -> dict[str, Any]:
        """Execute the tool with given parameters and multimodal context."""
        pass

    def to_schema(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "permission_level": self.permission_level,
            "parameters": self.parameters_schema,
        }
