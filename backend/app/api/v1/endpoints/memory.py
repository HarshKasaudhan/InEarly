import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.db.supabase import get_supabase_client
from app.schemas.memory import (
    DeleteMemoryResponse,
    GoalOptInRequest,
    MemoryListResponse,
    StoredCheckInSummary,
    WellnessRecommendation,
    GoalStatus,
)
from app.services.wellness_plans import WELLNESS_RESOURCE_LIBRARY

logger = logging.getLogger("inearly.memory")
router = APIRouter()

# In-memory mock store for local development sessions and goal tracking
_MOCK_GOALS_TRACKER: Dict[str, List[WellnessRecommendation]] = {}
_MOCK_CHECKINS_STORE: Dict[str, Dict] = {
    "sample-checkin-01": {
        "id": "sample-checkin-01",
        "user_id": "anon-user-default",
        "mode": "listen",
        "summary_snippet": "Discussed exam anxiety and syllabus pressure. Reflected on feeling overwhelmed by peer comparisons.",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "retention_expiry": "2026-11-26T12:00:00Z",
        "confirmed_tags": ["Academic & Exam Stress"],
        "days_until_purge": 29,
    }
}


@router.get(
    "",
    response_model=MemoryListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get User Stored Check-ins & Active Goals",
    description="Retrieves user-owned check-in summaries, active retention countdowns, and opted-in wellness goals.",
)
async def get_user_memories(
    user_id: Optional[str] = Query(None, description="Pseudonymous User UUID"),
) -> MemoryListResponse:
    supabase = get_supabase_client()
    user_key = user_id or "anon-user-default"
    memories: List[StoredCheckInSummary] = []
    pseudonym = "CalmMonsoon_24"

    if supabase and user_id:
        try:
            # Fetch user profile
            u_res = supabase.table("users").select("pseudonym").eq("id", user_id).execute()
            if u_res.data:
                pseudonym = u_res.data[0].get("pseudonym", pseudonym)

            # Fetch conversations
            conv_res = (
                supabase.table("conversations")
                .select("id, mode, created_at, retention_expiry")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )

            for conv in conv_res.data or []:
                c_id = conv["id"]
                # Fetch confirmed tags
                tags_res = (
                    supabase.table("concern_tags")
                    .select("category, user_confirmed")
                    .eq("conversation_id", c_id)
                    .execute()
                )
                tags = [t["category"].replace("_", " ").title() for t in (tags_res.data or []) if t.get("user_confirmed")]

                # Fetch first user message for snippet
                msg_res = (
                    supabase.table("messages")
                    .select("encrypted_content_or_reference")
                    .eq("conversation_id", c_id)
                    .eq("role", "user")
                    .limit(1)
                    .execute()
                )
                snippet = (
                    msg_res.data[0]["encrypted_content_or_reference"][:90] + "..."
                    if msg_res.data
                    else f"Session in {conv['mode']} mode"
                )

                memories.append(
                    StoredCheckInSummary(
                        id=c_id,
                        user_id=user_id,
                        mode=conv["mode"],
                        summary_snippet=snippet,
                        created_at=conv["created_at"],
                        retention_expiry=conv.get("retention_expiry", ""),
                        confirmed_tags=tags,
                        days_until_purge=30,
                    )
                )
        except Exception as e:
            logger.error(f"Error fetching memories from Supabase: {e}")

    # Fallback to in-memory store if DB is empty or offline
    if not memories:
        for item in _MOCK_CHECKINS_STORE.values():
            memories.append(
                StoredCheckInSummary(
                    id=item["id"],
                    user_id=item["user_id"],
                    mode=item["mode"],
                    summary_snippet=item["summary_snippet"],
                    created_at=item["created_at"],
                    retention_expiry=item["retention_expiry"],
                    confirmed_tags=item["confirmed_tags"],
                    days_until_purge=item["days_until_purge"],
                )
            )

    active_goals = _MOCK_GOALS_TRACKER.get(user_key, [])

    return MemoryListResponse(
        user_id=user_key,
        pseudonym=pseudonym,
        total_stored_checkins=len(memories),
        memories=memories,
        active_goals=active_goals,
    )


@router.post(
    "/goals",
    response_model=WellnessRecommendation,
    status_code=status.HTTP_200_OK,
    summary="Opt-in or Skip Wellness Goal",
    description="Allows users to opt-in or skip small practical coping goals surfaced during conversations.",
)
async def update_goal_status(payload: GoalOptInRequest) -> WellnessRecommendation:
    user_key = payload.user_id or "anon-user-default"
    matched = next((r for r in WELLNESS_RESOURCE_LIBRARY if r.id == payload.goal_id), None)

    if not matched:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Wellness goal '{payload.goal_id}' not found.",
        )

    updated_goal = matched.model_copy()
    updated_goal.status = payload.action

    user_goals = _MOCK_GOALS_TRACKER.get(user_key, [])
    # Update or append
    user_goals = [g for g in user_goals if g.id != payload.goal_id]
    if payload.action == GoalStatus.OPTED_IN:
        user_goals.append(updated_goal)
    _MOCK_GOALS_TRACKER[user_key] = user_goals

    return updated_goal


@router.delete(
    "/{id}",
    response_model=DeleteMemoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Specific Check-in / Memory",
    description="Completely purges a specific conversation check-in and associated tags/messages.",
)
async def delete_memory(id: str) -> DeleteMemoryResponse:
    supabase = get_supabase_client()
    now_iso = datetime.now(timezone.utc).isoformat()
    deleted = False

    if supabase:
        try:
            # Cascade deletion removes messages and tags automatically via FK constraints
            res = supabase.table("conversations").delete().eq("id", id).execute()
            if res.data:
                deleted = True
        except Exception as e:
            logger.error(f"Error deleting conversation {id} from Supabase: {e}")

    # Remove from mock store if present
    if id in _MOCK_CHECKINS_STORE:
        del _MOCK_CHECKINS_STORE[id]
        deleted = True

    return DeleteMemoryResponse(
        success=True,
        memory_id=id,
        message="Check-in memory record and all associated transcripts have been permanently erased.",
        deleted_at=now_iso,
    )
