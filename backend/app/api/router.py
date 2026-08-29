from fastapi import APIRouter
from app.api.system import collect_system_status
from app.api.ai import router as ai_router
from app.api.devices import router as devices_router

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "ultron-core"}


@router.get("/system/status")
async def system_status() -> dict[str, float | str | None]:
    return collect_system_status()


router.include_router(ai_router, prefix="/api")
router.include_router(devices_router, prefix="/api")
