from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class GoalStatus(str, Enum):
    OPTED_IN = "opted_in"
    SKIPPED = "skipped"
    COMPLETED = "completed"


class WellnessRecommendation(BaseModel):
    id: str = Field(..., description="Unique slug for the coping step")
    title: str = Field(..., description="Gentle, actionable title")
    duration_minutes: int = Field(..., description="Estimated time commitment (1 to 10 mins)")
    evidence_rationale: str = Field(..., description="Brief, plain-language scientific grounding")
    category: str = Field(..., description="Matched theme e.g., academic_stress, sleep_concern")
    instructions: List[str] = Field(..., description="2-3 simple, progressive steps")
    status: GoalStatus = Field(default=GoalStatus.SKIPPED)


class GoalOptInRequest(BaseModel):
    user_id: Optional[str] = None
    goal_id: str
    action: GoalStatus = GoalStatus.OPTED_IN  # opted_in or skipped


class StoredCheckInSummary(BaseModel):
    id: str
    user_id: str
    mode: str
    summary_snippet: str
    created_at: str
    retention_expiry: str
    confirmed_tags: List[str] = []
    days_until_purge: int
    data_retention_policy: str = "DPDP 30-day ephemeral auto-prune"


class MemoryListResponse(BaseModel):
    user_id: str
    pseudonym: str
    total_stored_checkins: int
    memories: List[StoredCheckInSummary]
    active_goals: List[WellnessRecommendation] = []
    privacy_notice: str = "All check-ins are user-owned and subject to irreversible deletion on demand."


class DeleteMemoryResponse(BaseModel):
    success: bool
    memory_id: str
    message: str
    deleted_at: str


class AccountErasureRequest(BaseModel):
    user_id: str
    reason: Optional[str] = "User exercised DPDP Right to Erasure"


class AccountErasureResponse(BaseModel):
    success: bool
    user_id: str
    records_deleted: int
    erasure_type: str = "Cryptographic Hard Erasure (DPDP Act 2023 Compliant)"
    timestamp: str
    message: str = "All user records, conversations, tags, and consent logs have been completely wiped."
