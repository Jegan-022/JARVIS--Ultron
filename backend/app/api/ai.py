from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel
from app.ai.agent import ultron_agent
from app.tools.registry import tool_registry

router = APIRouter(prefix="/ai", tags=["AI Agent"])


class AICommandRequest(BaseModel):
    command: str
    activeScene: str | None = "galaxy"
    selectedObject: dict[str, Any] | None = None
    handGesture: str | None = "NONE"
    cursorPosition: dict[str, Any] | None = None
    cameraPosition: list[float] | None = None


class ToolExecuteRequest(BaseModel):
    name: str
    parameters: dict[str, Any] = {}
    confirmed: bool = False


@router.post("/command")
async def process_command(req: AICommandRequest) -> dict[str, Any]:
    context = {
        "activeScene": req.activeScene,
        "selectedObject": req.selectedObject,
        "handGesture": req.handGesture,
        "cursorPosition": req.cursorPosition,
        "cameraPosition": req.cameraPosition,
    }
    return await ultron_agent.process_command(req.command, context=context)


@router.get("/tools")
async def list_tools() -> list[dict[str, Any]]:
    return tool_registry.list_schemas()


@router.post("/tools/execute")
async def execute_tool_direct(req: ToolExecuteRequest) -> dict[str, Any]:
    return await tool_registry.execute_tool(
        req.name,
        req.parameters,
        confirmed=req.confirmed,
    )
