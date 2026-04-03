import json
from datetime import datetime, timezone

import aiosqlite
from config import settings

DB_PATH = str(settings.DATABASE_PATH)


async def _seed_marketplace_listings(db: aiosqlite.Connection) -> None:
    cursor = await db.execute("SELECT COUNT(*) AS c FROM marketplace_listings")
    row = await cursor.fetchone()
    # init_db() does not set row_factory; COUNT(*) comes back as a tuple (n,)
    count = row[0] if row else 0
    if count and count > 0:
        return

    now = datetime.now(timezone.utc).isoformat()
    seed_rows = [
        {
            "id": "lst-nova-voice",
            "display_name": "Nova Verma",
            "handle": "nova.verma",
            "category": "Voice Artist",
            "headline": "Warm, confident narration voice licensed synthetic usage",
            "assets": "Voice",
            "allowed_platforms": json.dumps(["Instagram", "YouTube", "LinkedIn", "Website", "Other"]),
            "term_days": 30,
            "territory": "Worldwide",
            "allowed_use_cases": "\n".join(["Brand narration", "Product demos", "Educational content"]),
            "prohibited_use_cases": "\n".join(["Political ads", "Adult content", "Fraud / impersonation"]),
            "amount_inr": 1499.0,
            "verified": 1,
        },
        {
            "id": "lst-arya-face",
            "display_name": "Arya Kapoor",
            "handle": "arya.k",
            "category": "Creator",
            "headline": "UGC face license for ads pre-approved usage categories",
            "assets": "Face",
            "allowed_platforms": json.dumps(["Instagram", "TikTok", "YouTube", "Website"]),
            "term_days": 14,
            "territory": "India",
            "allowed_use_cases": "\n".join(["UGC ads", "Explainer videos", "Brand campaigns"]),
            "prohibited_use_cases": "\n".join(["Adult content", "Fraud / impersonation", "Medical claims"]),
            "amount_inr": 2999.0,
            "verified": 1,
        },
        {
            "id": "lst-zenith-duo",
            "display_name": "Zenith Studio",
            "handle": "zenith.studio",
            "category": "Brand",
            "headline": "Brand avatar license (face + voice) for enterprise comms",
            "assets": "Face+Voice",
            "allowed_platforms": json.dumps(["LinkedIn", "Website", "Other"]),
            "term_days": 90,
            "territory": "Worldwide",
            "allowed_use_cases": "\n".join(["Internal training", "Product onboarding", "Corporate comms"]),
            "prohibited_use_cases": "\n".join(["Adult content", "Fraud / impersonation", "Political messaging"]),
            "amount_inr": 9999.0,
            "verified": 0,
        },
    ]
    system_user = "system_seed"
    for r in seed_rows:
        await db.execute(
            """
            INSERT INTO marketplace_listings
            (id, user_id, display_name, handle, category, headline, assets, allowed_platforms, term_days, territory, allowed_use_cases, prohibited_use_cases, amount_inr, verified, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                r["id"],
                system_user,
                r["display_name"],
                r["handle"],
                r["category"],
                r["headline"],
                r["assets"],
                r["allowed_platforms"],
                r["term_days"],
                r["territory"],
                r["allowed_use_cases"],
                r["prohibited_use_cases"],
                r["amount_inr"],
                r["verified"],
                now,
            ),
        )


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS identities (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                face_embedding_path TEXT,
                voice_embedding_path TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                identity_id TEXT,
                deepfake_score REAL,
                face_match_score REAL,
                voice_match_score REAL,
                llm_explanation TEXT,
                report_path TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (identity_id) REFERENCES identities(id)
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS marketplace_transactions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                listing_id TEXT NOT NULL,
                buyer_name TEXT NOT NULL,
                buyer_email TEXT NOT NULL,
                platform TEXT NOT NULL,
                intended_use TEXT NOT NULL,
                reference_url TEXT,
                amount_inr REAL NOT NULL,
                status TEXT NOT NULL,
                certificate_path TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS notice_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                target_type TEXT NOT NULL,
                target_value TEXT NOT NULL,
                platform TEXT,
                content_url TEXT,
                evidence_summary TEXT,
                document_type TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS marketplace_listings (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                display_name TEXT NOT NULL,
                handle TEXT NOT NULL,
                category TEXT NOT NULL,
                headline TEXT NOT NULL,
                assets TEXT NOT NULL,
                allowed_platforms TEXT NOT NULL,
                term_days INTEGER NOT NULL DEFAULT 30,
                territory TEXT NOT NULL DEFAULT 'Worldwide',
                allowed_use_cases TEXT,
                prohibited_use_cases TEXT,
                amount_inr REAL NOT NULL,
                verified INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS disputes (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                target_user TEXT NOT NULL,
                reason TEXT NOT NULL,
                evidence_summary TEXT,
                content_url TEXT,
                resolution_sought TEXT NOT NULL DEFAULT 'content_removal',
                status TEXT NOT NULL DEFAULT 'open',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS misuse_reports (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                platform TEXT NOT NULL,
                content_url TEXT,
                evidence_summary TEXT,
                report_type TEXT NOT NULL DEFAULT 'deepfake_misuse',
                description TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'submitted',
                created_at TEXT NOT NULL
            )
            """
        )
        # Lightweight migration for existing DBs
        cursor = await db.execute("PRAGMA table_info(identities)")
        identity_cols = {row[1] for row in await cursor.fetchall()}
        if "user_id" not in identity_cols:
            await db.execute("ALTER TABLE identities ADD COLUMN user_id TEXT")

        cursor = await db.execute("PRAGMA table_info(analyses)")
        analysis_cols = {row[1] for row in await cursor.fetchall()}
        if "user_id" not in analysis_cols:
            await db.execute("ALTER TABLE analyses ADD COLUMN user_id TEXT")

        await _seed_marketplace_listings(db)
        await db.commit()
