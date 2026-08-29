from app.api.system import collect_system_status


def test_collect_system_status_shape() -> None:
    payload = collect_system_status()
    assert "cpuPercent" in payload
    assert "memoryPercent" in payload
    assert payload["network"] == "ONLINE"
    assert isinstance(payload["timestamp"], float)
