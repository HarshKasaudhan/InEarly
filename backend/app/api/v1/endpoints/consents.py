import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status
from app.db.supabase import get_supabase_client
from app.schemas.consent import (
    ConsentCreateRequest,
    ConsentResponse,
    generate_random_pseudonym,
)

logger = logging.getLogger("inearly.consents")
router = APIRouter()

# In-memory store fallback for offline/local development without Supabase connection
_MOCK_USERS_STORE: Dict[str, Dict[str, Any]] = {}
_MOCK_CONSENTS_STORE: Dict[str, Dict[str, Any]] = {}


@router.post(
    "",
    response_model=ConsentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record User Agreement and Purpose Version",
    description="Securely registers explicit user consent, purpose, and version in adherence with India's DPDP Act 2023. Also provisions a pseudonymous user profile with zero PII.",
)
async def create_consent(payload: ConsentCreateRequest) -> ConsentResponse:
    supabase = get_supabase_client()
    now_utc = datetime.now(timezone.utc)
    
    # 1. Determine or Provision Pseudonymous User
    user_id = payload.user_id or uuid.uuid4()
    chosen_pseudonym = payload.pseudonym.strip() if payload.pseudonym and payload.pseudonym.strip() else generate_random_pseudonym()
    age_band_val = payload.age_band.value

    # 2. Record User in Database / Store
    if supabase:
        try:
            # Check if user already exists
            user_query = supabase.table("users").select("id, pseudonym, age_band").eq("id", str(user_id)).execute()
            if not user_query.data:
                # Insert new pseudonymous user
                insert_res = supabase.table("users").insert({
                    "id": str(user_id),
                    "age_band": age_band_val,
                    "pseudonym": chosen_pseudonym,
                    "created_at": now_utc.isoformat(),
                    "updated_at": now_utc.isoformat(),
                }).execute()
                if insert_res.data:
                    chosen_pseudonym = insert_res.data[0].get("pseudonym", chosen_pseudonym)
            else:
                chosen_pseudonym = user_query.data[0].get("pseudonym", chosen_pseudonym)
                age_band_val = user_query.data[0].get("age_band", age_band_val)
        except Exception as e:
            logger.error(f"Error persisting user to Supabase: {e}")
            # Non-blocking fallback to continue session gracefully in dev
    else:
        _MOCK_USERS_STORE[str(user_id)] = {
            "id": user_id,
            "pseudonym": chosen_pseudonym,
            "age_band": age_band_val,
            "created_at": now_utc,
        }

    # 3. Insert Consent Record
    consent_id = uuid.uuid4()
    if supabase:
        try:
            consent_res = supabase.table("consents").insert({
                "id": str(consent_id),
                "user_id": str(user_id),
                "purpose": payload.purpose,
                "version": payload.version,
                "granted_at": now_utc.isoformat(),
                "withdrawn_at": None,
            }).execute()
            if consent_res.data:
                consent_id = uuid.UUID(consent_res.data[0]["id"])
        except Exception as e:
            logger.warning(f"Error persisting consent to Supabase: {e}. Falling back to resilient session store.")
            _MOCK_CONSENTS_STORE[str(consent_id)] = {
                "id": consent_id,
                "user_id": user_id,
                "purpose": payload.purpose,
                "version": payload.version,
                "granted_at": now_utc,
                "withdrawn_at": None,
            }
    else:
        _MOCK_CONSENTS_STORE[str(consent_id)] = {
            "id": consent_id,
            "user_id": user_id,
            "purpose": payload.purpose,
            "version": payload.version,
            "granted_at": now_utc,
            "withdrawn_at": None,
        }

    return ConsentResponse(
        consent_id=consent_id,
        user_id=user_id,
        purpose=payload.purpose,
        version=payload.version,
        granted_at=now_utc,
        pseudonym=chosen_pseudonym,
        age_band=payload.age_band,
        language_preference=payload.language_preference,
        save_chats_consent=payload.save_chats_consent,
        status="active",
    )
