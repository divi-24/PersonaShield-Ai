import mimetypes
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from auth import get_current_user_id
from config import settings
from database import get_db
from models import AnalysisResponse
from services import deepfake_service, face_service, llm_service, report_service, video_utils, voice_service

router = APIRouter(prefix="/api", tags=["analysis"])


def _media_category(filename: str) -> str:
    mime, _ = mimetypes.guess_type(filename)
    if mime:
        if mime.startswith("image"):
            return "image"
        if mime.startswith("video"):
            return "video"
        if mime.startswith("audio"):
            return "audio"
    ext = Path(filename).suffix.lower()
    if ext in {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"}:
        return "image"
    if ext in {".mp4", ".avi", ".mov", ".mkv", ".webm"}:
        return "video"
    if ext in {".wav", ".mp3", ".flac", ".ogg", ".m4a"}:
        return "audio"
    return "unknown"


async def _save_upload(upload: UploadFile) -> str:
    settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    ext = ""
    if upload.filename:
        ext = "." + upload.filename.rsplit(".", 1)[-1] if "." in upload.filename else ""
    filename = f"{uuid.uuid4().hex}{ext}"
    path = settings.UPLOADS_DIR / filename
    content = await upload.read()
    path.write_bytes(content)
    return str(path)


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_media(
    media_file: UploadFile = File(...),
    identity_id: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id),
):
    analysis_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc).isoformat()

    # Save upload
    file_path = await _save_upload(media_file)
    category = _media_category(media_file.filename or file_path)

    # Deepfake detection
    df_result = await deepfake_service.detect_deepfake(file_path, api_token=settings.HUGGINGFACE_API_TOKEN)
    deepfake_score = df_result["confidence"]

    # For video, extract a frame and audio track for downstream services
    face_input = file_path
    voice_input = file_path
    if category == "video":
        frame = video_utils.extract_frame(file_path)
        if frame:
            face_input = frame
        audio = video_utils.extract_audio(file_path)
        if audio:
            voice_input = audio

    # Identity matching
    face_match_score: Optional[float] = None
    voice_match_score: Optional[float] = None

    if identity_id:
        db = await get_db()
        try:
            cursor = await db.execute(
                "SELECT face_embedding_path, voice_embedding_path FROM identities WHERE id = ? AND user_id = ?",
                (identity_id, user_id),
            )
            row = await cursor.fetchone()
        finally:
            await db.close()

        if not row:
            raise HTTPException(status_code=404, detail="Identity not found")

        # Face matching (for images and video)
        if category in ("image", "video") and row["face_embedding_path"]:
            try:
                face_match_score = face_service.compare_faces(row["face_embedding_path"], face_input)
            except Exception:
                face_match_score = None

        # Voice matching (for audio and video)
        if category in ("audio", "video") and row["voice_embedding_path"]:
            try:
                voice_match_score = voice_service.compare_voices(row["voice_embedding_path"], voice_input)
            except Exception:
                voice_match_score = None

    # Calculate authenticity score (weighted average)
    components: list[float] = [100.0 - deepfake_score]
    if face_match_score is not None:
        components.append(face_match_score)
    if voice_match_score is not None:
        components.append(voice_match_score)
    authenticity_score = round(sum(components) / len(components), 2)

    is_deepfake = deepfake_score > 50.0

    # LLM explanation
    explanation = await llm_service.generate_explanation(
        deepfake_score=deepfake_score,
        face_match=face_match_score,
        voice_match=voice_match_score,
        details=df_result.get("details", ""),
        api_token=settings.HUGGINGFACE_API_TOKEN,
    )

    # Generate PDF report
    report_path = report_service.generate_report(
        analysis_id=analysis_id,
        deepfake_score=deepfake_score,
        face_match_score=face_match_score,
        voice_match_score=voice_match_score,
        authenticity_score=authenticity_score,
        explanation=explanation,
        is_deepfake=is_deepfake,
    )
    report_filename = Path(report_path).name
    report_url = f"/reports/{report_filename}"

    # Store in DB
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO analyses (id, user_id, identity_id, deepfake_score, face_match_score, voice_match_score, llm_explanation, report_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (analysis_id, user_id, identity_id, deepfake_score, face_match_score, voice_match_score, explanation, report_path, now),
        )
        await db.commit()
    finally:
        await db.close()

    return AnalysisResponse(
        id=analysis_id,
        identity_id=identity_id,
        deepfake_score=deepfake_score,
        face_match_score=face_match_score,
        voice_match_score=voice_match_score,
        authenticity_score=authenticity_score,
        explanation=explanation,
        report_url=report_url,
        is_deepfake=is_deepfake,
        created_at=now,
    )


@router.get("/analyses", response_model=list[AnalysisResponse])
async def list_analyses(user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, identity_id, deepfake_score, face_match_score, voice_match_score, llm_explanation, report_path, created_at FROM analyses WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        )
        rows = await cursor.fetchall()
    finally:
        await db.close()

    results: list[AnalysisResponse] = []
    for r in rows:
        ds = r["deepfake_score"] or 0.0
        fm = r["face_match_score"]
        vm = r["voice_match_score"]
        components = [100.0 - ds]
        if fm is not None:
            components.append(fm)
        if vm is not None:
            components.append(vm)
        authenticity = round(sum(components) / len(components), 2)
        report_url = None
        if r["report_path"]:
            report_url = f"/reports/{Path(r['report_path']).name}"
        results.append(
            AnalysisResponse(
                id=r["id"],
                identity_id=r["identity_id"],
                deepfake_score=ds,
                face_match_score=fm,
                voice_match_score=vm,
                authenticity_score=authenticity,
                explanation=r["llm_explanation"] or "",
                report_url=report_url,
                is_deepfake=ds > 50.0,
                created_at=r["created_at"],
            )
        )
    return results


@router.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: str, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, identity_id, deepfake_score, face_match_score, voice_match_score, llm_explanation, report_path, created_at FROM analyses WHERE id = ? AND user_id = ?",
            (analysis_id, user_id),
        )
        row = await cursor.fetchone()
    finally:
        await db.close()

    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found")

    ds = row["deepfake_score"] or 0.0
    fm = row["face_match_score"]
    vm = row["voice_match_score"]
    components = [100.0 - ds]
    if fm is not None:
        components.append(fm)
    if vm is not None:
        components.append(vm)
    authenticity = round(sum(components) / len(components), 2)
    report_url = None
    if row["report_path"]:
        report_url = f"/reports/{Path(row['report_path']).name}"

    return AnalysisResponse(
        id=row["id"],
        identity_id=row["identity_id"],
        deepfake_score=ds,
        face_match_score=fm,
        voice_match_score=vm,
        authenticity_score=authenticity,
        explanation=row["llm_explanation"] or "",
        report_url=report_url,
        is_deepfake=ds > 50.0,
        created_at=row["created_at"],
    )
