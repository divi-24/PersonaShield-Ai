import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from config import settings
from database import init_db
from routers import analyze, commerce, disputes, legal_assistant, register, report

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    for d in [settings.STORAGE_DIR, settings.UPLOADS_DIR, settings.EMBEDDINGS_DIR, settings.REPORTS_DIR]:
        d.mkdir(parents=True, exist_ok=True)
    await init_db()
    logger.info("PersonaShield AI backend started")
    yield
    # Shutdown
    logger.info("PersonaShield AI backend shutting down")


app = FastAPI(
    title="PersonaShield AI",
    description="AI-powered identity verification and deepfake detection platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(register.router)
app.include_router(analyze.router)
app.include_router(report.router)
app.include_router(legal_assistant.router)
app.include_router(commerce.router)
app.include_router(disputes.router)

# Static file serving for reports
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/reports", StaticFiles(directory=str(settings.REPORTS_DIR)), name="reports")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    if settings.FRONTEND_DIST and settings.FRONTEND_DIST.is_dir():
        index = settings.FRONTEND_DIST / "index.html"
        if index.is_file():
            return FileResponse(index)
    return {
        "name": "PersonaShield AI",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "register": "/api/register",
            "identities": "/api/identities",
            "analyze": "/api/analyze",
            "analyses": "/api/analyses",
            "reports": "/api/reports",
            "legal_assistant": "/api/legal-assistant/chat",
            "marketplace": "/api/marketplace/listings",
            "marketplace_transactions": "/api/marketplace/transactions",
            "disputes": "/api/disputes",
            "misuse_reports": "/api/misuse-reports",
            "notices": "/api/notices",
            "docs": "/docs",
        },
    }


if settings.FRONTEND_DIST and settings.FRONTEND_DIST.is_dir():
    dist = settings.FRONTEND_DIST.resolve()
    assets_dir = dist / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend_assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        # Do not shadow /api/* or /reports/* ; OpenAPI routes (/docs, /openapi.json) are registered before this route.
        if full_path.startswith("api/") or full_path.startswith("reports/"):
            raise HTTPException(status_code=404, detail="Not found")
        target = dist / full_path
        if target.is_file():
            return FileResponse(target)
        index = dist / "index.html"
        if index.is_file():
            return FileResponse(index)
        raise HTTPException(status_code=404, detail="Not found")
