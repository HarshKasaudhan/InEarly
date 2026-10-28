import uuid
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMode(str, Enum):
    LISTEN = "listen"  # "Just Listen" - Empathetic venting & reflective listening
    PLAN = "plan"      # "Help Me Plan" - Gentle cognitive reframing & micro-action steps


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    role: MessageRole
    content: str


class ConcernTagItem(BaseModel):
    category: str = Field(..., description="Theme identifier e.g., academic_stress, sleep_concern")
    display_label: str = Field(..., description="Human-readable label e.g., Academic Stress")
    tentative_flag: bool = Field(default=True, description="Indicates this tag is an AI hypothesis")
    confidence: float = Field(default=0.85, description="Confidence score between 0.0 and 1.0")
    user_confirmed: bool = Field(default=False, description="Explicit user confirmation state")


class ChatRequest(BaseModel):
    conversation_id: Optional[uuid.UUID] = Field(
        default=None,
        description="Optional session conversation UUID. Generated automatically if blank."
    )
    user_id: Optional[uuid.UUID] = Field(
        default=None,
        description="Optional anonymous user UUID from onboarding."
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="User input message."
    )
    history: List[ChatMessage] = Field(
        default=[],
        description="Recent conversation history for conversational context."
    )
    mode: ChatMode = Field(
        default=ChatMode.LISTEN,
        description="Active chat mode: 'listen' (Just Listen) or 'plan' (Help Me Plan)."
    )
    language_preference: str = Field(
        default="Hinglish",
        description="Language style: 'Hindi', 'Hinglish', or 'English'."
    )
    age_band: Optional[str] = Field(
        default="18-24",
        description="Coarse demographic band for contextual sensitivity."
    )


class HelplineCard(BaseModel):
    name: str
    number: str
    toll_free_alt: str
    description: str
    type: str
    availability: str


class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    reply: str
    mode: ChatMode
    tentative_tags: List[ConcernTagItem]
    safety_alert: bool = False
    resources: List[str] = Field(
        default=[],
        description="National helpline numbers if crisis indicators or support resources apply."
    )
    helpline_details: List[HelplineCard] = Field(
        default=[],
        description="Structured verified Indian crisis helpline cards."
    )
    model_used: str = "gemini-2.5-flash"


class ChatMessageDetail(BaseModel):
    id: str
    role: MessageRole
    content: str
    timestamp: str


class ConversationSummary(BaseModel):
    id: str
    user_id: str
    mode: ChatMode
    title: str
    created_at: str
    message_count: int = 0
    preview: str = ""
    tags: List[str] = []


class ConversationDetail(BaseModel):
    id: str
    user_id: str
    mode: ChatMode
    title: str
    created_at: str
    messages: List[ChatMessageDetail] = []
    tags: List[ConcernTagItem] = []


class CreateConversationRequest(BaseModel):
    user_id: uuid.UUID
    mode: ChatMode = ChatMode.LISTEN
    title: Optional[str] = None


class PurgeConversationsResponse(BaseModel):
    success: bool
    user_id: str
    deleted_count: int
    message: str

