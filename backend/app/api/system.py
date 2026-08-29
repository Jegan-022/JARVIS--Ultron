from __future__ import annotations

import time

try:
    import psutil
except ImportError:  # pragma: no cover
    psutil = None


def collect_system_status() -> dict[str, float | str | None]:
    cpu: float | None = None
    memory: float | None = None
    if psutil is not None:
        cpu = float(psutil.cpu_percent(interval=None))
        memory = float(psutil.virtual_memory().percent)
    return {
        "cpuPercent": cpu,
        "memoryPercent": memory,
        "gpuPercent": None,
        "network": "ONLINE",
        "timestamp": time.time(),
    }
