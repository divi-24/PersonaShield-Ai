import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user_id
from config import settings
from database import get_db
from models import (
    MarketplaceListingCreate,
    MarketplaceListingResponse,
    MarketplaceListingUpdate,
    NoticeLogCreateRequest,
    NoticeLogResponse,
    TransactionCreateRequest,
    TransactionResponse,
)

router = APIRouter(prefix="/api", tags=["commerce"])


def _row_to_listing_response(row) -> MarketplaceListingResponse:
    return MarketplaceListingResponse(
        id=row["id"],
        user_id=row["user_id"],
        display_name=row["display_name"],
        handle=row["handle"],
        category=row["category"],
        headline=row["headline"],
        assets=row["assets"],
        allowed_platforms=row["allowed_platforms"],
        term_days=int(row["term_days"] or 30),
        territory=row["territory"] or "Worldwide",
        allowed_use_cases=row["allowed_use_cases"] or "",
        prohibited_use_cases=row["prohibited_use_cases"] or "",
        amount_inr=float(row["amount_inr"] or 0.0),
        verified=bool(row["verified"]),
        created_at=row["created_at"],
    )


@router.get("/marketplace/listings", response_model=list[MarketplaceListingResponse])
async def list_marketplace_listings():
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT id, user_id, display_name, handle, category, headline, assets, allowed_platforms,
                   term_days, territory, allowed_use_cases, prohibited_use_cases, amount_inr, verified, created_at
            FROM marketplace_listings
            ORDER BY created_at DESC
            """
        )
        rows = await cursor.fetchall()
    finally:
        await db.close()
    return [_row_to_listing_response(r) for r in rows]


@router.get("/marketplace/listings/{listing_id}", response_model=MarketplaceListingResponse)
async def get_marketplace_listing(listing_id: str):
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT id, user_id, display_name, handle, category, headline, assets, allowed_platforms,
                   term_days, territory, allowed_use_cases, prohibited_use_cases, amount_inr, verified, created_at
            FROM marketplace_listings WHERE id = ?
            """,
            (listing_id,),
        )
        row = await cursor.fetchone()
    finally:
        await db.close()
    if not row:
        raise HTTPException(status_code=404, detail="Listing not found")
    return _row_to_listing_response(row)


@router.post("/marketplace/listings", response_model=MarketplaceListingResponse)
async def create_marketplace_listing(body: MarketplaceListingCreate, user_id: str = Depends(get_current_user_id)):
    listing_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc).isoformat()
    db = await get_db()
    try:
        await db.execute(
            """
            INSERT INTO marketplace_listings
            (id, user_id, display_name, handle, category, headline, assets, allowed_platforms, term_days, territory, allowed_use_cases, prohibited_use_cases, amount_inr, verified, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                listing_id,
                user_id,
                body.display_name,
                body.handle,
                body.category,
                body.headline,
                body.assets,
                body.allowed_platforms,
                body.term_days,
                body.territory,
                body.allowed_use_cases,
                body.prohibited_use_cases,
                body.amount_inr,
                1 if body.verified else 0,
                now,
            ),
        )
        await db.commit()
        cursor = await db.execute(
            """
            SELECT id, user_id, display_name, handle, category, headline, assets, allowed_platforms,
                   term_days, territory, allowed_use_cases, prohibited_use_cases, amount_inr, verified, created_at
            FROM marketplace_listings WHERE id = ?
            """,
            (listing_id,),
        )
        row = await cursor.fetchone()
    finally:
        await db.close()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to load created listing")
    return _row_to_listing_response(row)


@router.patch("/marketplace/listings/{listing_id}", response_model=MarketplaceListingResponse)
async def update_marketplace_listing(
    listing_id: str, body: MarketplaceListingUpdate, user_id: str = Depends(get_current_user_id)
):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT user_id FROM marketplace_listings WHERE id = ?",
            (listing_id,),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Listing not found")
        if row["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not allowed to modify this listing")

        updates: dict[str, object] = {}
        if body.display_name is not None:
            updates["display_name"] = body.display_name
        if body.handle is not None:
            updates["handle"] = body.handle
        if body.category is not None:
            updates["category"] = body.category
        if body.headline is not None:
            updates["headline"] = body.headline
        if body.assets is not None:
            updates["assets"] = body.assets
        if body.allowed_platforms is not None:
            updates["allowed_platforms"] = body.allowed_platforms
        if body.term_days is not None:
            updates["term_days"] = body.term_days
        if body.territory is not None:
            updates["territory"] = body.territory
        if body.allowed_use_cases is not None:
            updates["allowed_use_cases"] = body.allowed_use_cases
        if body.prohibited_use_cases is not None:
            updates["prohibited_use_cases"] = body.prohibited_use_cases
        if body.amount_inr is not None:
            updates["amount_inr"] = body.amount_inr
        if body.verified is not None:
            updates["verified"] = 1 if body.verified else 0

        if updates:
            sets = ", ".join(f"{k} = ?" for k in updates)
            vals = list(updates.values())
            vals.append(listing_id)
            await db.execute(f"UPDATE marketplace_listings SET {sets} WHERE id = ?", vals)
            await db.commit()

        cursor = await db.execute(
            """
            SELECT id, user_id, display_name, handle, category, headline, assets, allowed_platforms,
                   term_days, territory, allowed_use_cases, prohibited_use_cases, amount_inr, verified, created_at
            FROM marketplace_listings WHERE id = ?
            """,
            (listing_id,),
        )
        out = await cursor.fetchone()
    finally:
        await db.close()
    if not out:
        raise HTTPException(status_code=404, detail="Listing not found")
    return _row_to_listing_response(out)


@router.delete("/marketplace/listings/{listing_id}")
async def delete_marketplace_listing(listing_id: str, user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT user_id FROM marketplace_listings WHERE id = ?",
            (listing_id,),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Listing not found")
        if row["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not allowed to delete this listing")
        await db.execute("DELETE FROM marketplace_listings WHERE id = ?", (listing_id,))
        await db.commit()
    finally:
        await db.close()
    return {"ok": True, "id": listing_id}


@router.post("/marketplace/transactions", response_model=TransactionResponse)
async def create_transaction(request: TransactionCreateRequest, user_id: str = Depends(get_current_user_id)):
    tx_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc).isoformat()

    settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    certificate_filename = f"consent_{tx_id}.json"
    certificate_path = settings.REPORTS_DIR / certificate_filename
    certificate_payload = {
        "transaction_id": tx_id,
        "generated_at": now,
        "user_id": user_id,
        "listing_id": request.listing_id,
        "buyer_name": request.buyer_name,
        "buyer_email": request.buyer_email,
        "platform": request.platform,
        "intended_use": request.intended_use,
        "reference_url": request.reference_url,
        "amount_inr": request.amount_inr,
        "status": "paid",
    }
    certificate_path.write_text(json.dumps(certificate_payload, indent=2), encoding="utf-8")

    db = await get_db()
    try:
        await db.execute(
            """
            INSERT INTO marketplace_transactions
            (id, user_id, listing_id, buyer_name, buyer_email, platform, intended_use, reference_url, amount_inr, status, certificate_path, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                tx_id,
                user_id,
                request.listing_id,
                request.buyer_name,
                request.buyer_email,
                request.platform,
                request.intended_use,
                request.reference_url,
                request.amount_inr,
                "paid",
                str(certificate_path),
                now,
            ),
        )
        await db.commit()
    finally:
        await db.close()

    return TransactionResponse(
        id=tx_id,
        listing_id=request.listing_id,
        buyer_name=request.buyer_name,
        buyer_email=request.buyer_email,
        platform=request.platform,
        intended_use=request.intended_use,
        reference_url=request.reference_url,
        amount_inr=request.amount_inr,
        status="paid",
        certificate_url=f"/reports/{certificate_filename}",
        created_at=now,
    )


@router.get("/marketplace/transactions", response_model=list[TransactionResponse])
async def list_transactions(user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT id, listing_id, buyer_name, buyer_email, platform, intended_use, reference_url, amount_inr, status, certificate_path, created_at
            FROM marketplace_transactions
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        rows = await cursor.fetchall()
    finally:
        await db.close()

    results: list[TransactionResponse] = []
    for row in rows:
        cert_url = None
        if row["certificate_path"]:
            cert_url = f"/reports/{Path(row['certificate_path']).name}"
        results.append(
            TransactionResponse(
                id=row["id"],
                listing_id=row["listing_id"],
                buyer_name=row["buyer_name"],
                buyer_email=row["buyer_email"],
                platform=row["platform"],
                intended_use=row["intended_use"],
                reference_url=row["reference_url"],
                amount_inr=row["amount_inr"],
                status=row["status"],
                certificate_url=cert_url,
                created_at=row["created_at"],
            )
        )
    return results


@router.post("/notices", response_model=NoticeLogResponse)
async def create_notice(request: NoticeLogCreateRequest, user_id: str = Depends(get_current_user_id)):
    notice_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc).isoformat()

    db = await get_db()
    try:
        await db.execute(
            """
            INSERT INTO notice_logs
            (id, user_id, target_type, target_value, platform, content_url, evidence_summary, document_type, message, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                notice_id,
                user_id,
                request.target_type,
                request.target_value,
                request.platform,
                request.content_url,
                request.evidence_summary,
                request.document_type,
                request.message,
                request.status,
                now,
            ),
        )
        await db.commit()
    finally:
        await db.close()

    return NoticeLogResponse(
        id=notice_id,
        target_type=request.target_type,
        target_value=request.target_value,
        platform=request.platform,
        content_url=request.content_url,
        evidence_summary=request.evidence_summary,
        document_type=request.document_type,
        message=request.message,
        status=request.status,
        created_at=now,
    )


@router.get("/notices", response_model=list[NoticeLogResponse])
async def list_notices(user_id: str = Depends(get_current_user_id)):
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT id, target_type, target_value, platform, content_url, evidence_summary, document_type, message, status, created_at
            FROM notice_logs
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        rows = await cursor.fetchall()
    finally:
        await db.close()

    return [
        NoticeLogResponse(
            id=row["id"],
            target_type=row["target_type"],
            target_value=row["target_value"],
            platform=row["platform"],
            content_url=row["content_url"],
            evidence_summary=row["evidence_summary"],
            document_type=row["document_type"],
            message=row["message"],
            status=row["status"],
            created_at=row["created_at"],
        )
        for row in rows
    ]

