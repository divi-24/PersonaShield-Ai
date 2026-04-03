from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user_id
from config import settings
from database import get_db
from models import ReportResponse

router = APIRouter(prefix="/api", tags=["reports"])


@router.get("/reports/{analysis_id}", response_model=ReportResponse)
async def get_report(analysis_id: str, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT report_path, created_at FROM analyses WHERE id = ? AND user_id = ?",
            (analysis_id, user_id),
        )
        row = await cursor.fetchone()
    finally:
        await db.close()

    if not row or not row["report_path"]:
        raise HTTPException(status_code=404, detail="Report not found")

    report_path = Path(row["report_path"])
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report file not found on disk")

    report_url = f"/reports/{report_path.name}"
    return ReportResponse(report_url=report_url, generated_at=row["created_at"])


@router.get("/reports", response_model=list[ReportResponse])
async def list_reports(user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT report_path, created_at FROM analyses WHERE user_id = ? AND report_path IS NOT NULL ORDER BY created_at DESC",
            (user_id,),
        )
        rows = await cursor.fetchall()
    finally:
        await db.close()

    results: list[ReportResponse] = []
    for r in rows:
        if r["report_path"]:
            name = Path(r["report_path"]).name
            results.append(ReportResponse(report_url=f"/reports/{name}", generated_at=r["created_at"]))
    return results
