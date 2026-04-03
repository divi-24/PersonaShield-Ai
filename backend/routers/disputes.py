import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user_id
from database import get_db
from models import (
    DisputeCreateRequest,
    DisputeResponse,
    DisputeUpdateRequest,
    MisuseReportCreate,
    MisuseReportResponse,
)

router = APIRouter(prefix="/api", tags=["disputes"])


@router.post("/disputes", response_model=DisputeResponse)
async def create_dispute(body: DisputeCreateRequest, user_id: str = Depends(get_current_user_id)):
    dispute_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc).isoformat()
    db = await get_db()
    try:
        await db.execute(
            """
            INSERT INTO disputes
            (id, user_id, target_user, reason, evidence_summary, content_url, resolution_sought, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
            """,
            (
                dispute_id,
                user_id,
                body.target_user,
                body.reason,
                body.evidence_summary,
                body.content_url,
                body.resolution_sought,
                now,
                now,
            ),
        )
        await db.commit()
        cursor = await db.execute(
            """
            SELECT id, user_id, target_user, reason, evidence_summary, content_url, resolution_sought, status, created_at, updated_at
            FROM disputes WHERE id = ?
            """,
            (dispute_id,),
        )
        row = await cursor.fetchone()
    finally:
        await db.close()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to load dispute")
    return _dispute_row(row)


def _dispute_row(row) -> DisputeResponse:
    return DisputeResponse(
        id=row["id"],
        user_id=row["user_id"],
        target_user=row["target_user"],
        reason=row["reason"],
        evidence_summary=row["evidence_summary"],
        content_url=row["content_url"],
        resolution_sought=row["resolution_sought"],
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.get("/disputes", response_model=list[DisputeResponse])
async def list_disputes(user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT id, user_id, target_user, reason, evidence_summary, content_url, resolution_sought, status, created_at, updated_at
            FROM disputes WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        rows = await cursor.fetchall()
    finally:
        await db.close()
    return [_dispute_row(r) for r in rows]


@router.patch("/disputes/{dispute_id}", response_model=DisputeResponse)
async def update_dispute(
    dispute_id: str, body: DisputeUpdateRequest, user_id: str = Depends(get_current_user_id)
):
    if body.status is None:
        raise HTTPException(status_code=400, detail="No fields to update")
    allowed = {"open", "in_review", "resolved", "withdrawn", "closed"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")

    now = datetime.now(timezone.utc).isoformat()
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT user_id FROM disputes WHERE id = ?",
            (dispute_id,),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Dispute not found")
        if row["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not allowed to update this dispute")

        await db.execute(
            "UPDATE disputes SET status = ?, updated_at = ? WHERE id = ?",
            (body.status, now, dispute_id),
        )
        await db.commit()
        cursor = await db.execute(
            """
            SELECT id, user_id, target_user, reason, evidence_summary, content_url, resolution_sought, status, created_at, updated_at
            FROM disputes WHERE id = ?
            """,
            (dispute_id,),
        )
        out = await cursor.fetchone()
    finally:
        await db.close()
    if not out:
        raise HTTPException(status_code=404, detail="Dispute not found")
    return _dispute_row(out)


@router.post("/misuse-reports", response_model=MisuseReportResponse)
async def create_misuse_report(body: MisuseReportCreate, user_id: str = Depends(get_current_user_id)):
    report_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc).isoformat()
    db = await get_db()
    try:
        await db.execute(
            """
            INSERT INTO misuse_reports
            (id, user_id, platform, content_url, evidence_summary, report_type, description, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', ?)
            """,
            (
                report_id,
                user_id,
                body.platform,
                body.content_url,
                body.evidence_summary,
                body.report_type,
                body.description,
                now,
            ),
        )
        await db.commit()
        cursor = await db.execute(
            """
            SELECT id, user_id, platform, content_url, evidence_summary, report_type, description, status, created_at
            FROM misuse_reports WHERE id = ?
            """,
            (report_id,),
        )
        row = await cursor.fetchone()
    finally:
        await db.close()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to load report")
    return _misuse_row(row)


def _misuse_row(row) -> MisuseReportResponse:
    return MisuseReportResponse(
        id=row["id"],
        user_id=row["user_id"],
        platform=row["platform"],
        content_url=row["content_url"],
        evidence_summary=row["evidence_summary"],
        report_type=row["report_type"],
        description=row["description"],
        status=row["status"],
        created_at=row["created_at"],
    )


@router.get("/misuse-reports", response_model=list[MisuseReportResponse])
async def list_misuse_reports(user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT id, user_id, platform, content_url, evidence_summary, report_type, description, status, created_at
            FROM misuse_reports WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        rows = await cursor.fetchall()
    finally:
        await db.close()
    return [_misuse_row(r) for r in rows]
