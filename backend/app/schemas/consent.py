import random
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class AgeBandEnum(str, Enum):
    SCHOOL = "13-17"       # School Student
    COLLEGE = "18-24"      # College Student / Young Learner
    YOUNG_ADULT = "25-34"  # Young Adult / Early Career
    MID_ADULT = "35-49"    # Working Professional / Mid-Adult
    SENIOR = "50+"         # Senior / 50+


class LanguagePreferenceEnum(str, Enum):
    HINDI = "Hindi"
    HINGLISH = "Hinglish"
    ENGLISH = "English"


INDIAN_INSPIRED_PSEUDONYMS = [
    "ShantiBreeze",
    "BanyanSoul",
    "NeemLeaf",
    "RiverNarmada",
    "LotusBloom",
    "CalmMonsoon",
    "SahyadriMist",
    "GoldenPipal",
    "PavanEcho",
    "ChaiWarmth",
    "GulmoharPetal",
    "BraveSparrow",
    "QuietDeodar",
    "SereneGhat",
    "TealSkyline",
]


def generate_random_pseudonym() -> str:
    """Generates a culturally warm, non-identifying pseudonym."""
    moniker = random.choice(INDIAN_INSPIRED_PSEUDONYMS)
    random_digits = random.randint(10, 99)
    return f"{moniker}_{random_digits}"


class ConsentCreateRequest(BaseModel):
    user_id: Optional[uuid.UUID] = Field(
        default=None,
        description="Optional existing User UUID. If not provided, a new pseudonymous user is created."
    )
    age_band: AgeBandEnum = Field(
        default=AgeBandEnum.COLLEGE,
        description="Coarse age band enforcing data minimization (13-17, 18-24, 25-34, 35-49, 50+)."
    )
    pseudonym: Optional[str] = Field(
        default=None,
        description="Non-identifying moniker. If blank, a culturally thoughtful pseudonym is generated."
    )
    purpose: str = Field(
        default="ai_mental_wellness_support",
        description="DPDP specific purpose string."
    )
    version: str = Field(
        default="1.0",
        description="Version string of the privacy terms and disclosures."
    )
    agreed: bool = Field(
        ...,
        description="Explicit user agreement to plain-language disclosures."
    )
    language_preference: LanguagePreferenceEnum = Field(
        default=LanguagePreferenceEnum.HINGLISH,
        description="Code-switching language preference: Hindi, Hinglish, or English."
    )
    save_chats_consent: bool = Field(
        default=False,
        description="User control over whether conversations are saved (default false = ephemeral mode)."
    )

    @field_validator("agreed")
    @classmethod
    def validate_agreement(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Explicit consent must be granted to proceed under DPDP Act requirements.")
        return v


class ConsentResponse(BaseModel):
    consent_id: uuid.UUID
    user_id: uuid.UUID
    purpose: str
    version: str
    granted_at: datetime
    pseudonym: str
    age_band: AgeBandEnum
    language_preference: LanguagePreferenceEnum
    save_chats_consent: bool
    status: str = "active"
    disclosures_acknowledged: list[str] = Field(
        default=[
            "You can skip questions",
            "You control whether chats are saved",
            "This is AI, not a clinician",
            "Zero PII data minimization"
        ]
    )
