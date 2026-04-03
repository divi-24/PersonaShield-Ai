import logging
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import settings

logger = logging.getLogger(__name__)

HTTPX_AVAILABLE = False
try:
    import httpx

    HTTPX_AVAILABLE = True
except ImportError:
    pass

_security = HTTPBearer(auto_error=True)
_jwks_cache: dict[str, Any] | None = None


async def _get_jwks() -> dict[str, Any]:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    if not settings.CLERK_JWKS_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server auth misconfigured: CLERK_JWKS_URL missing",
        )
    if not HTTPX_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server auth misconfigured: httpx unavailable",
        )

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(settings.CLERK_JWKS_URL)
    if resp.status_code != 200:
        logger.error("Unable to fetch Clerk JWKS: status=%d body=%s", resp.status_code, resp.text[:500])
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Unable to validate auth token")

    _jwks_cache = resp.json()
    return _jwks_cache


async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(_security)) -> str:
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    jwks = await _get_jwks()
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth token")

        key_data = None
        for jwk in jwks.get("keys", []):
            if jwk.get("kid") == kid:
                key_data = jwk
                break
        if key_data is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown token key")

        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER or None,
            options={"verify_aud": False},
        )
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
        return str(sub)
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Token validation failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc

