import pytest
from app.tools.registry import tool_registry


@pytest.mark.asyncio
async def test_tool_registry_schemas():
    schemas = tool_registry.list_schemas()
    assert len(schemas) >= 10
    names = [s["name"] for s in schemas]
    assert "rotate_scene" in names
    assert "zoom_scene" in names
    assert "change_scene" in names
    assert "control_home_device" in names
    assert "get_system_status" in names


@pytest.mark.asyncio
async def test_change_scene_tool():
    res = await tool_registry.execute_tool("change_scene", {"scene": "earth"})
    assert res["success"] is True
    assert res["result"]["scene"] == "earth"


@pytest.mark.asyncio
async def test_rotate_scene_tool():
    res = await tool_registry.execute_tool("rotate_scene", {"direction": "left", "speed": 0.8})
    assert res["success"] is True
    assert res["result"]["direction"] == "left"


@pytest.mark.asyncio
async def test_select_object_tool():
    res = await tool_registry.execute_tool("select_object", {"object_id": "earth"})
    assert res["success"] is True
    assert res["result"]["object_details"]["id"] == "earth"


@pytest.mark.asyncio
async def test_show_information_multimodal_context():
    context = {"selectedObject": {"id": "mars", "name": "Mars"}}
    res = await tool_registry.execute_tool("show_information", {"target": "this"}, context=context)
    assert res["success"] is True
    assert res["result"]["target"] == "mars"


@pytest.mark.asyncio
async def test_control_home_device_tool():
    res = await tool_registry.execute_tool(
        "control_home_device",
        {"device": "bedroom_light", "action": "turn_on"},
    )
    assert res["success"] is True
    assert res["result"]["action"] == "turn_on"


@pytest.mark.asyncio
async def test_sensitive_tool_confirmation():
    # Sensitive tool without confirmation
    res = await tool_registry.execute_tool("take_screenshot", {}, confirmed=False)
    assert res.get("requires_confirmation") is True

    # Sensitive tool with confirmation
    res_confirmed = await tool_registry.execute_tool("take_screenshot", {}, confirmed=True)
    assert res_confirmed["success"] is True
