from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

# Always load backend/.env from this package directory (not cwd), so uvicorn works
# whether you start from repo root or from backend/.
_BACKEND_ENV = Path(__file__).resolve().parent / ".env"


class Settings(BaseSettings):
    HUGGINGFACE_API_TOKEN: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    CLERK_ISSUER: str = ""
    CLERK_JWKS_URL: str = ""

    BASE_DIR: Path = Path(__file__).resolve().parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOADS_DIR: Path = STORAGE_DIR / "uploads"
    EMBEDDINGS_DIR: Path = STORAGE_DIR / "embeddings"
    REPORTS_DIR: Path = BASE_DIR / "reports"
    DATABASE_PATH: Path = BASE_DIR / "persona.db"
    # When set, built SPA files are served for same-origin deploys (see main.py).
    FRONTEND_DIST: Optional[Path] = None

    model_config = SettingsConfigDict(
        env_file=str(_BACKEND_ENV),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
