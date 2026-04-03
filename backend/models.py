from typing import Literal, Optional
from pydantic import BaseModel, Field


class IdentityCreate(BaseModel):
    name: str
    email: str


class IdentityResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str


class IdentityListItemResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str
    has_face_embedding: bool
    has_voice_embedding: bool
    analysis_count: int = 0


class AnalysisRequest(BaseModel):
    identity_id: Optional[str] = None


class AnalysisResponse(BaseModel):
    id: str
    identity_id: Optional[str] = None
    deepfake_score: float
    face_match_score: Optional[float] = None
    voice_match_score: Optional[float] = None
    authenticity_score: float
    explanation: str
    report_url: Optional[str] = None
    is_deepfake: bool
    created_at: Optional[str] = None


class ReportResponse(BaseModel):
    report_url: str
    generated_at: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class LegalAssistantRequest(BaseModel):
    messages: list[ChatMessage]
    analysis_id: Optional[str] = None
    identity_id: Optional[str] = None
    document_type: Optional[str] = None


class LegalAssistantResponse(BaseModel):
    reply: str


class TransactionCreateRequest(BaseModel):
    listing_id: str
    buyer_name: str
    buyer_email: str
    platform: str
    intended_use: str
    reference_url: Optional[str] = None
    amount_inr: float


class TransactionResponse(BaseModel):
    id: str
    listing_id: str
    buyer_name: str
    buyer_email: str
    platform: str
    intended_use: str
    reference_url: Optional[str] = None
    amount_inr: float
    status: str
    certificate_url: Optional[str] = None
    created_at: str


class NoticeLogCreateRequest(BaseModel):
    target_type: str
    target_value: str
    platform: Optional[str] = None
    content_url: Optional[str] = None
    evidence_summary: Optional[str] = None
    document_type: str
    message: str
    status: str = "sent"


class NoticeLogResponse(BaseModel):
    id: str
    target_type: str
    target_value: str
    platform: Optional[str] = None
    content_url: Optional[str] = None
    evidence_summary: Optional[str] = None
    document_type: str
    message: str
    status: str
    created_at: str


class IdentityScanSummary(BaseModel):
    id: str
    created_at: str
    deepfake_score: float
    is_deepfake: bool


class IdentityDetailResponse(BaseModel):
    id: str
    name: str
    email: str
    has_face_embedding: bool
    has_voice_embedding: bool
    created_at: str
    analysis_count: int = 0
    last_scan_at: Optional[str] = None
    recent_scans: list[IdentityScanSummary] = Field(default_factory=list)


class MarketplaceListingCreate(BaseModel):
    display_name: str
    handle: str
    category: str
    headline: str
    assets: str
    allowed_platforms: str
    term_days: int = 30
    territory: str = "Worldwide"
    allowed_use_cases: str = ""
    prohibited_use_cases: str = ""
    amount_inr: float
    verified: bool = False


class MarketplaceListingResponse(BaseModel):
    id: str
    user_id: str
    display_name: str
    handle: str
    category: str
    headline: str
    assets: str
    allowed_platforms: str
    term_days: int
    territory: str
    allowed_use_cases: str
    prohibited_use_cases: str
    amount_inr: float
    verified: bool
    created_at: str


class MarketplaceListingUpdate(BaseModel):
    display_name: Optional[str] = None
    handle: Optional[str] = None
    category: Optional[str] = None
    headline: Optional[str] = None
    assets: Optional[str] = None
    allowed_platforms: Optional[str] = None
    term_days: Optional[int] = None
    territory: Optional[str] = None
    allowed_use_cases: Optional[str] = None
    prohibited_use_cases: Optional[str] = None
    amount_inr: Optional[float] = None
    verified: Optional[bool] = None


class DisputeCreateRequest(BaseModel):
    target_user: str
    reason: str
    evidence_summary: Optional[str] = None
    content_url: Optional[str] = None
    resolution_sought: str = "content_removal"


class DisputeResponse(BaseModel):
    id: str
    user_id: str
    target_user: str
    reason: str
    evidence_summary: Optional[str] = None
    content_url: Optional[str] = None
    resolution_sought: str
    status: str
    created_at: str
    updated_at: str


class DisputeUpdateRequest(BaseModel):
    status: Optional[str] = None


class MisuseReportCreate(BaseModel):
    platform: str
    content_url: Optional[str] = None
    evidence_summary: Optional[str] = None
    report_type: str = "deepfake_misuse"
    description: str


class MisuseReportResponse(BaseModel):
    id: str
    user_id: str
    platform: str
    content_url: Optional[str] = None
    evidence_summary: Optional[str] = None
    report_type: str
    description: str
    status: str
    created_at: str
