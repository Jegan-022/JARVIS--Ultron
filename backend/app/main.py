import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import router
from app.config.settings import settings
from app.websocket.system import router as ws_router
from app.devices.mqtt import mqtt_bridge

logger = logging.getLogger("jarvis.core")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Manage application startup and shutdown lifecycle."""
    # Startup
    logger.info("J.A.R.V.I.S. Core — initializing subsystems...")
    try:
        mqtt_bridge.start()
        logger.info("MQTT Bridge: online")
    except Exception as e:
        logger.warning(f"MQTT Bridge: offline ({e})")
    logger.info("J.A.R.V.I.S. Core — all systems operational.")
    yield
    # Shutdown
    logger.info("J.A.R.V.I.S. Core — shutting down gracefully.")


app = FastAPI(
    title="J.A.R.V.I.S. Core",
    description="Just A Rather Very Intelligent System — Advanced Spatial AI Interface",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(ws_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "name": "J.A.R.V.I.S.",
        "version": "2.0.0",
        "status": "online",
        "message": "All systems nominal, sir.",
    }
