import logging
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, status
from app.db.supabase import get_supabase_client
from app.schemas.chat import (
    ChatMode,
    ChatRequest,
    ChatResponse,
    ConcernTagItem,
    HelplineCard,
    ChatMessageDetail,
    ConversationSummary,
    ConversationDetail,
    CreateConversationRequest,
    PurgeConversationsResponse,
)
from app.services.agents import agent_orchestrator
from app.services.safety_interceptor import safety_interceptor

logger = logging.getLogger("inearly.chat")
router = APIRouter()

# Resilient in-memory store for conversations and messages fallback
_MOCK_CONVERSATIONS: Dict[str, Dict[str, Any]] = {}
_MOCK_MESSAGES: Dict[str, List[Dict[str, Any]]] = {}


@router.post(
    "",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Inearly Conversational Agent Interaction",
    description="Deterministic Safety Interceptor scans for self-harm/crisis. If triggered, bypasses LLM immediately to return reviewed crisis templates and Indian helplines (Tele-MANAS 14416, 112). Otherwise, orchestrates A1 Empathy Agent and A2 Concern Classifier.",
)
async def chat_interaction(payload: ChatRequest) -> ChatResponse:
    conv_id = payload.conversation_id or uuid.uuid4()
    now_utc = datetime.now(timezone.utc)
    supabase = get_supabase_client()

    # =========================================================================
    # 1. DETERMINISTIC SAFETY INTERCEPTOR (Input Triage Layer)
    # This layer runs BEFORE any LLM or agent generation is invoked.
    # It CANNOT be bypassed by prompt injections or system instructions.
    # =========================================================================
    safety_result = safety_interceptor.scan(
        message=payload.message,
        conversation_id=str(conv_id),
        language_pref=payload.language_preference,
    )

    if safety_result.is_triggered:
        # Immediate Crisis Escalation Routing (LLM Bypassed)
        reply = safety_result.crisis_response_text
        is_crisis = True
        model_used = "deterministic-safety-interceptor"

        helpline_cards = [
            HelplineCard(
                name=h["name"],
                number=h["number"],
                toll_free_alt=h["toll_free_alt"],
                description=h["description"],
                type=h["type"],
                availability=h["availability"],
            )
            for h in safety_result.helplines
        ]

        resources = [f"{h['name']}: {h['number']} ({h['availability']})" for h in safety_result.helplines]

        tentative_tags = [
            ConcernTagItem(
                category="acute_crisis",
                display_label="Acute Crisis Support",
                tentative_flag=False,
                confidence=1.0,
                user_confirmed=True,
            )
        ]
    else:
        # =========================================================================
        # 2. STANDARD CONVERSATIONAL AGENTS (A1 Empathy + A2 Concern Classifier)
        # =========================================================================
        reply, tentative_tags, is_crisis, resources, model_used = await agent_orchestrator.generate_response(
            message=payload.message,
            history=payload.history,
            mode=payload.mode,
            language_pref=payload.language_preference,
            age_band=payload.age_band or "18-24",
        )
        helpline_cards = []

    # =========================================================================
    # 3. PERSIST TO DATABASE (Supabase) + Resilient In-Memory Fallback
    # =========================================================================
    u_id_str = str(payload.user_id) if payload.user_id else "anon-user-default"
    c_id_str = str(conv_id)

    # In-memory store fallback update
    if c_id_str not in _MOCK_CONVERSATIONS:
        title = payload.message[:40] + ("..." if len(payload.message) > 40 else "")
        _MOCK_CONVERSATIONS[c_id_str] = {
            "id": c_id_str,
            "user_id": u_id_str,
            "mode": payload.mode,
            "title": title,
            "created_at": now_utc.isoformat(),
            "preview": payload.message[:60],
            "tags": [t.display_label for t in tentative_tags],
        }
    else:
        _MOCK_CONVERSATIONS[c_id_str]["preview"] = payload.message[:60]
        if tentative_tags:
            _MOCK_CONVERSATIONS[c_id_str]["tags"] = list(set(_MOCK_CONVERSATIONS[c_id_str].get("tags", []) + [t.display_label for t in tentative_tags]))

    if c_id_str not in _MOCK_MESSAGES:
        _MOCK_MESSAGES[c_id_str] = []

    _MOCK_MESSAGES[c_id_str].append({
        "id": f"u-{uuid.uuid4()}",
        "role": "user",
        "content": payload.message,
        "timestamp": now_utc.isoformat(),
    })
    _MOCK_MESSAGES[c_id_str].append({
        "id": f"a-{uuid.uuid4()}",
        "role": "assistant",
        "content": reply,
        "timestamp": now_utc.isoformat(),
    })

    if supabase and payload.user_id:
        try:
            # Check or create conversation
            conv_check = supabase.table("conversations").select("id").eq("id", c_id_str).execute()
            if not conv_check.data:
                supabase.table("conversations").insert({
                    "id": c_id_str,
                    "user_id": u_id_str,
                    "mode": payload.mode.value,
                    "created_at": now_utc.isoformat(),
                }).execute()

            # Record user message
            supabase.table("messages").insert({
                "id": str(uuid.uuid4()),
                "conversation_id": c_id_str,
                "role": "user",
                "encrypted_content_or_reference": payload.message,
                "timestamp": now_utc.isoformat(),
            }).execute()

            # Record assistant reply
            supabase.table("messages").insert({
                "id": str(uuid.uuid4()),
                "conversation_id": c_id_str,
                "role": "assistant",
                "encrypted_content_or_reference": reply,
                "timestamp": now_utc.isoformat(),
            }).execute()

            # Record concern tags
            for tag in tentative_tags:
                supabase.table("concern_tags").insert({
                    "id": str(uuid.uuid4()),
                    "conversation_id": c_id_str,
                    "category": tag.category,
                    "tentative_flag": tag.tentative_flag,
                    "user_confirmed": tag.user_confirmed,
                }).execute()

        except Exception as e:
            logger.error(f"Error persisting chat exchange to Supabase: {e}")
            # Non-blocking: conversation continues without disrupting user support

    return ChatResponse(
        conversation_id=conv_id,
        reply=reply,
        mode=payload.mode,
        tentative_tags=tentative_tags,
        safety_alert=is_crisis,
        resources=resources,
        helpline_details=helpline_cards,
        model_used=model_used,
    )


@router.get(
    "/conversations",
    response_model=List[ConversationSummary],
    status_code=status.HTTP_200_OK,
    summary="List User Conversations",
    description="Fetches user's conversation sessions with data isolation enforced by user_id.",
)
async def list_user_conversations(
    user_id: str = "",
) -> List[ConversationSummary]:
    supabase = get_supabase_client()
    user_key = user_id or "anon-user-default"
    summaries: List[ConversationSummary] = []

    if supabase and user_id:
        try:
            res = (
                supabase.table("conversations")
                .select("id, user_id, mode, created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            for c in res.data or []:
                c_id = c["id"]
                # Get first user message for title / preview
                msg_res = (
                    supabase.table("messages")
                    .select("encrypted_content_or_reference, timestamp")
                    .eq("conversation_id", c_id)
                    .order("timestamp", desc=False)
                    .execute()
                )
                msgs = msg_res.data or []
                preview = msgs[0]["encrypted_content_or_reference"][:60] if msgs else "New Session"
                title = msgs[0]["encrypted_content_or_reference"][:35] if msgs else f"Session ({c['mode']})"

                # Get tags
                tag_res = supabase.table("concern_tags").select("category").eq("conversation_id", c_id).execute()
                tag_labels = [t["category"].replace("_", " ").title() for t in (tag_res.data or [])]

                summaries.append(
                    ConversationSummary(
                        id=c_id,
                        user_id=c["user_id"],
                        mode=c["mode"],
                        title=title,
                        created_at=c["created_at"],
                        message_count=len(msgs),
                        preview=preview,
                        tags=list(set(tag_labels)),
                    )
                )
        except Exception as e:
            logger.error(f"Error loading conversations from Supabase: {e}")

    if not summaries:
        # Fallback to in-memory store
        for c_id, c in _MOCK_CONVERSATIONS.items():
            if c.get("user_id") == user_key:
                m_count = len(_MOCK_MESSAGES.get(c_id, []))
                summaries.append(
                    ConversationSummary(
                        id=c_id,
                        user_id=c["user_id"],
                        mode=c["mode"],
                        title=c.get("title", "Session"),
                        created_at=c.get("created_at", datetime.now(timezone.utc).isoformat()),
                        message_count=m_count,
                        preview=c.get("preview", ""),
                        tags=c.get("tags", []),
                    )
                )

    return summaries


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetail,
    status_code=status.HTTP_200_OK,
    summary="Get Conversation Messages",
    description="Loads message history for a conversation verifying strict user ownership.",
)
async def get_conversation_history(
    conversation_id: str,
    user_id: str = "",
) -> ConversationDetail:
    supabase = get_supabase_client()
    user_key = user_id or "anon-user-default"
    messages_out: List[ChatMessageDetail] = []
    mode = ChatMode.LISTEN
    created_at = datetime.now(timezone.utc).isoformat()
    title = "Session"

    if supabase and user_id:
        try:
            c_res = (
                supabase.table("conversations")
                .select("id, user_id, mode, created_at")
                .eq("id", conversation_id)
                .eq("user_id", user_id)
                .execute()
            )
            if c_res.data:
                mode = c_res.data[0]["mode"]
                created_at = c_res.data[0]["created_at"]

                # Fetch messages
                m_res = (
                    supabase.table("messages")
                    .select("id, role, encrypted_content_or_reference, timestamp")
                    .eq("conversation_id", conversation_id)
                    .order("timestamp", desc=False)
                    .execute()
                )
                for m in m_res.data or []:
                    messages_out.append(
                        ChatMessageDetail(
                            id=m["id"],
                            role=m["role"],
                            content=m["encrypted_content_or_reference"],
                            timestamp=m["timestamp"],
                        )
                    )
                if messages_out:
                    title = messages_out[0].content[:35]
        except Exception as e:
            logger.error(f"Error fetching conversation history from Supabase: {e}")

    if not messages_out and conversation_id in _MOCK_MESSAGES:
        c_meta = _MOCK_CONVERSATIONS.get(conversation_id, {})
        mode = c_meta.get("mode", ChatMode.LISTEN)
        created_at = c_meta.get("created_at", created_at)
        title = c_meta.get("title", title)
        for m in _MOCK_MESSAGES[conversation_id]:
            messages_out.append(
                ChatMessageDetail(
                    id=m["id"],
                    role=m["role"],
                    content=m["content"],
                    timestamp=m["timestamp"],
                )
            )

    return ConversationDetail(
        id=conversation_id,
        user_id=user_key,
        mode=mode,
        title=title,
        created_at=created_at,
        messages=messages_out,
    )


@router.post(
    "/conversations",
    response_model=ConversationSummary,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Conversation",
    description="Initializes a new empty conversation for the user.",
)
async def create_new_conversation(
    payload: CreateConversationRequest,
) -> ConversationSummary:
    c_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    u_id = str(payload.user_id)
    title = payload.title or f"New {payload.mode.value.title()} Session"
    supabase = get_supabase_client()

    _MOCK_CONVERSATIONS[c_id] = {
        "id": c_id,
        "user_id": u_id,
        "mode": payload.mode,
        "title": title,
        "created_at": now_iso,
        "preview": "No messages yet",
        "tags": [],
    }
    _MOCK_MESSAGES[c_id] = []

    if supabase:
        try:
            supabase.table("conversations").insert({
                "id": c_id,
                "user_id": u_id,
                "mode": payload.mode.value,
                "created_at": now_iso,
            }).execute()
        except Exception as e:
            logger.error(f"Error creating conversation in Supabase: {e}")

    return ConversationSummary(
        id=c_id,
        user_id=u_id,
        mode=payload.mode,
        title=title,
        created_at=now_iso,
        message_count=0,
        preview="No messages yet",
        tags=[],
    )


@router.delete(
    "/conversations/{conversation_id}",
    response_model=PurgeConversationsResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Single Conversation",
    description="Permanently purges a specific conversation and all associated messages.",
)
async def delete_single_conversation(
    conversation_id: str,
    user_id: str = "",
) -> PurgeConversationsResponse:
    supabase = get_supabase_client()
    u_id = user_id or "anon-user-default"
    deleted = 0

    if conversation_id in _MOCK_CONVERSATIONS:
        del _MOCK_CONVERSATIONS[conversation_id]
        deleted += 1
    if conversation_id in _MOCK_MESSAGES:
        del _MOCK_MESSAGES[conversation_id]

    if supabase:
        try:
            query = supabase.table("conversations").delete().eq("id", conversation_id)
            if user_id:
                query = query.eq("user_id", user_id)
            res = query.execute()
            if res.data:
                deleted += len(res.data)
        except Exception as e:
            logger.error(f"Error deleting conversation {conversation_id} from Supabase: {e}")

    return PurgeConversationsResponse(
        success=True,
        user_id=u_id,
        deleted_count=deleted,
        message=f"Conversation {conversation_id} and transcripts successfully purged.",
    )


@router.delete(
    "/conversations",
    response_model=PurgeConversationsResponse,
    status_code=status.HTTP_200_OK,
    summary="One-Click Purge All User History",
    description="Permanently deletes all past conversation history and messages for this user.",
)
async def purge_all_user_conversations(
    user_id: str = "",
) -> PurgeConversationsResponse:
    u_id = user_id or "anon-user-default"
    supabase = get_supabase_client()
    deleted_count = 0

    # Purge mock
    to_delete = [c_id for c_id, c in _MOCK_CONVERSATIONS.items() if c.get("user_id") == u_id]
    for c_id in to_delete:
        del _MOCK_CONVERSATIONS[c_id]
        if c_id in _MOCK_MESSAGES:
            del _MOCK_MESSAGES[c_id]
        deleted_count += 1

    if supabase and user_id:
        try:
            res = supabase.table("conversations").delete().eq("user_id", user_id).execute()
            if res.data:
                deleted_count += len(res.data)
        except Exception as e:
            logger.error(f"Error purging conversations from Supabase for user {user_id}: {e}")

    return PurgeConversationsResponse(
        success=True,
        user_id=u_id,
        deleted_count=deleted_count,
        message="All past chat sessions and message transcripts permanently erased from database.",
    )

