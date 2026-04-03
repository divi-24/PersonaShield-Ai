import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from auth import get_current_user_id
from config import settings
from database import get_db
from models import IdentityDetailResponse, IdentityListItemResponse, IdentityResponse, IdentityScanSummary
from services import face_service, voice_service

router = APIRouter(prefix="/api", tags=["identity"])


async def _save_upload(upload: UploadFile, subdir: str = "") -> str:
    dest_dir = settings.UPLOADS_DIR / subdir if subdir else settings.UPLOADS_DIR
    dest_dir.mkdir(parents=True, exist_ok=True)
    ext = ""
    if upload.filename:
        ext = "." + upload.filename.rsplit(".", 1)[-1] if "." in upload.filename else ""
    filename = f"{uuid.uuid4().hex}{ext}"
    path = dest_dir / filename
    content = await upload.read()
    path.write_bytes(content)
    return str(path)


@router.post("/register", response_model=IdentityResponse)
async def register_identity(
    name: str = Form(...),
    email: str = Form(...),
    face_image: UploadFile = File(...),
    voice_audio: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    identity_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc).isoformat()

    # Save uploaded files
    face_path = await _save_upload(face_image, subdir="faces")
    voice_path = await _save_upload(voice_audio, subdir="voices")

    # Extract embeddings
    face_emb = face_service.extract_embedding(face_path)
    voice_emb = voice_service.extract_embedding(voice_path)

    # Save embeddings
    face_emb_path = str(settings.EMBEDDINGS_DIR / f"{identity_id}_face.npy")
    voice_emb_path = str(settings.EMBEDDINGS_DIR / f"{identity_id}_voice.npy")
    face_service.save_embedding(face_emb, face_emb_path)
    voice_service.save_embedding(voice_emb, voice_emb_path)

    # Store in DB
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO identities (id, user_id, name, email, face_embedding_path, voice_embedding_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (identity_id, user_id, name, email, face_emb_path, voice_emb_path, now),
        )
        await db.commit()
    finally:
        await db.close()

    return IdentityResponse(id=identity_id, name=name, email=email, created_at=now)


@router.get("/identities", response_model=list[IdentityListItemResponse])
async def list_identities(user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT
              i.id,
              i.name,
              i.email,
              i.created_at,
              i.face_embedding_path,
              i.voice_embedding_path,
              COUNT(a.id) AS analysis_count
            FROM identities i
            LEFT JOIN analyses a ON a.identity_id = i.id AND a.user_id = ?
            WHERE i.user_id = ?
            GROUP BY i.id, i.name, i.email, i.created_at, i.face_embedding_path, i.voice_embedding_path
            ORDER BY i.created_at DESC
            """,
            (user_id, user_id),
        )
        rows = await cursor.fetchall()
    finally:
        await db.close()
    return [
        IdentityListItemResponse(
            id=r["id"],
            name=r["name"],
            email=r["email"],
            created_at=r["created_at"],
            has_face_embedding=bool(r["face_embedding_path"]),
            has_voice_embedding=bool(r["voice_embedding_path"]),
            analysis_count=int(r["analysis_count"] or 0),
        )
        for r in rows
    ]


@router.get("/identities/{identity_id}", response_model=IdentityDetailResponse)
async def get_identity(identity_id: str, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, name, email, face_embedding_path, voice_embedding_path, created_at FROM identities WHERE id = ? AND user_id = ?",
            (identity_id, user_id),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Identity not found")

        cursor = await db.execute(
            "SELECT COUNT(*) AS c FROM analyses WHERE identity_id = ? AND user_id = ?",
            (identity_id, user_id),
        )
        count_row = await cursor.fetchone()
        analysis_count = int(count_row["c"] or 0) if count_row else 0

        cursor = await db.execute(
            """
            SELECT id, created_at, deepfake_score
            FROM analyses
            WHERE identity_id = ? AND user_id = ?
            ORDER BY created_at DESC
            LIMIT 8
            """,
            (identity_id, user_id),
        )
        scan_rows = await cursor.fetchall()
    finally:
        await db.close()

    last_scan_at = scan_rows[0]["created_at"] if scan_rows else None
    recent_scans = [
        IdentityScanSummary(
            id=s["id"],
            created_at=s["created_at"],
            deepfake_score=float(s["deepfake_score"] or 0.0),
            is_deepfake=float(s["deepfake_score"] or 0.0) > 50.0,
        )
        for s in scan_rows
    ]

    return IdentityDetailResponse(
        id=row["id"],
        name=row["name"],
        email=row["email"],
        has_face_embedding=bool(row["face_embedding_path"]),
        has_voice_embedding=bool(row["voice_embedding_path"]),
        created_at=row["created_at"],
        analysis_count=analysis_count,
        last_scan_at=last_scan_at,
        recent_scans=recent_scans,
    )
