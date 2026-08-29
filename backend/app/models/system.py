from pydantic import BaseModel, Field


class SystemStatus(BaseModel):
    cpu_percent: float | None = Field(default=None, alias="cpuPercent")
    memory_percent: float | None = Field(default=None, alias="memoryPercent")
    gpu_percent: float | None = Field(default=None, alias="gpuPercent")
    network: str = "ONLINE"
    timestamp: float

    model_config = {"populate_by_name": True}
