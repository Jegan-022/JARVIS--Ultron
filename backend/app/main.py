from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import router
from app.config.settings import settings
from app.websocket.system import router as ws_router

app = FastAPI(title="ULTRON Core", version="0.1.0")

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
    return {"name": "ULTRON", "phase": "1", "status": "online"}
