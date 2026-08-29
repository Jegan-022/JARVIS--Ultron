import pytest
from app.ai.agent import jarvis_agent


@pytest.mark.asyncio
async def test_agent_process_command():
    context = {
        "activeScene": "galaxy",
        "selectedObject": {"id": "earth", "name": "Earth"},
        "handGesture": "POINT",
    }
    result = await jarvis_agent.process_command("rotate the galaxy to the left", context=context)
    assert "text" in result
    assert "spoken_response" in result
    assert result["tool_executed"] == "rotate_scene"


@pytest.mark.asyncio
async def test_agent_multimodal_query():
    context = {
        "activeScene": "solar_system",
        "selectedObject": {"id": "earth", "name": "Earth"},
        "handGesture": "PINCH",
    }
    result = await jarvis_agent.process_command("tell me about this planet", context=context)
    assert "text" in result
    assert result["tool_executed"] == "show_information"
