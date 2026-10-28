import hashlib
import json
import logging
import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

# Dedicated audit logger for safety interceptor
logger = logging.getLogger("inearly.safety")

# Verified Indian Crisis Helpline Directory
VERIFIED_INDIAN_HELPLINES = [
    {
        "name": "Tele-MANAS (Govt. of India)",
        "number": "14416",
        "toll_free_alt": "1800-891-4416",
        "description": "Ministry of Health & Family Welfare 24/7 Comprehensive Mental Health Care (Available in 20+ Indian languages)",
        "type": "crisis_mental_health",
        "availability": "24/7 Free & Confidential",
    },
    {
        "name": "National Emergency Number",
        "number": "112",
        "toll_free_alt": "112",
        "description": "All-in-one Emergency Helpline across India for Police, Medical, & Immediate Physical Safety",
        "type": "immediate_emergency",
        "availability": "24/7 Immediate Dispatch",
    },
    {
        "name": "KIRAN Helpline",
        "number": "1800-599-0019",
        "toll_free_alt": "1800-599-0019",
        "description": "Department of Empowerment of Persons with Disabilities 24/7 Mental Health Helpline",
        "type": "crisis_mental_health",
        "availability": "24/7 Free & Confidential",
    },
    {
        "name": "Vandrevala Foundation",
        "number": "+91 9999 666 555",
        "toll_free_alt": "+91 9999 666 555",
        "description": "24/7 Free Crisis Counseling and Emotional Support",
        "type": "counseling_helpline",
        "availability": "24/7 Free & Confidential",
    },
]

# Non-judgmental, clinically vetted crisis escalation templates
CRISIS_RESPONSE_TEMPLATES = {
    "Hinglish": (
        "Main sun raha hoon aur aap jo gehra dard mehsoos kar rahe hain, use main deeply acknowledge karta hoon. "
        "Aapki suraksha sabse pehle aati hai aur aap akele nahi hain. "
        "Yeh ek AI system hai jo clinical crisis care nahi provide kar sakta. Kripya turant niche diye gaye verified 24/7 "
        "toll-free helplines par trained counselors se connect karein. Ye bilkul muft (free) aur poori tarah confidential hain:"
    ),
    "Hindi": (
        "मैं समझ सकता हूँ कि आप इस समय बहुत गहरे दर्द या तनाव से गुजर रहे हैं। आपकी सुरक्षा और जीवन सबसे महत्वपूर्ण है, "
        "और आप अकेले नहीं हैं। यह एक एआई (AI) प्रणाली है जो आपातकालीन या चिकित्सकीय सहायता नहीं दे सकती। "
        "कृपया बिना किसी झिझक के तुरंत नीचे दिए गए निःशुल्क और 24/7 गोपनीय हेल्पलाइन नंबरों पर संपर्क करें:"
    ),
    "English": (
        "I hear how much deep pain you are carrying right now. Your safety matters deeply, and you do not have to go through this alone. "
        "Because I am an AI and cannot provide crisis or clinical medical care, please reach out immediately to these free, "
        "verified 24/7 Indian crisis support helplines staffed by compassionate human professionals:"
    ),
}

# Deterministic Safety Regex Rules (English, Hinglish, and Hindi Devanagari)
CRISIS_REGEX_RULES: List[Tuple[str, str]] = [
    # Explicit crisis ideation & intent
    (
        r"\b(suicide|kill(ing)?\s*myself|end(ing)?\s*my\s*life|want(ing)?\s*to\s*die|want\s*to\s*end\s*it(\s*all)?|better\s*off\s*dead)\b",
        "ESC_INTENT_EN",
    ),
    (
        r"\b(not\s*worth\s*living|give\s*up\s*on\s*life|don'?t\s*want\s*to\s*(live|exist|wake\s*up)\s*(anymore)?)\b",
        "ESC_IDEATION_EN",
    ),
    # Self-harm & lethal means
    (
        r"\b(self[-\s]?harm|cut(ting)?\s*my\s*(wrist|arm|throat)|slit\s*my\s*wrist|overdos(e|ing)|hang(ing)?\s*myself|jump(ing)?\s*off\s*(a\s*)?(bridge|building|roof|terrace))\b",
        "ESC_LETHAL_MEANS_EN",
    ),
    # Hinglish phonetic crisis markers
    (
        r"\b(jaan\s*(de\s*dunga|de\s*dungi|lene|chali\s*jaye)|khatam\s*karna\s*chahta|marne\s*ka\s*mann|mar\s*jaana\s*chahta)\b",
        "ESC_INTENT_HINGLISH",
    ),
    (
        r"\b(jeene\s*ka\s*koi\s*fayda\s*nahi|zeher\s*(kha|pi)|faansi\s*laga|kud\s*ke\s*jaan|aatmhatya|kudkushi)\b",
        "ESC_LETHAL_MEANS_HINGLISH",
    ),
    # Hindi Devanagari crisis markers
    (
        r"(आत्महत्या|खुदकुशी|जान\s*देना|मरना\s*चाहता|मरने\s*का\s*मन|फाँसी\s*लगा|जहर\s*खा|जीने\s*का\s*मन\s*नहीं)",
        "ESC_DEVANAGARI_HI",
    ),
]


@dataclass
class SafetyAuditLogEntry:
    event_id: str
    timestamp: str
    conversation_id: str
    trigger_category: str
    trigger_code: str
    action_taken: str
    message_length: int
    message_sha256: str
    language_preference: str
    helplines_offered: List[str]


@dataclass
class SafetyInterceptorResult:
    is_triggered: bool
    trigger_category: Optional[str] = None
    trigger_code: Optional[str] = None
    crisis_response_text: Optional[str] = None
    helplines: List[Dict[str, str]] = field(default_factory=list)
    audit_entry: Optional[SafetyAuditLogEntry] = None


class DeterministicSafetyInterceptor:
    """
    Hardened, deterministic safety interceptor running BEFORE any agent logic.
    Guarantees immediate crisis escalation with reviewed non-judgmental templates
    and verified Indian emergency helplines.
    """

    def __init__(self):
        # Compile patterns for high-throughput scanning
        self.compiled_rules = [(re.compile(pattern, re.IGNORECASE), code) for pattern, code in CRISIS_REGEX_RULES]

    def scan(
        self,
        message: str,
        conversation_id: Optional[str] = None,
        language_pref: str = "Hinglish",
    ) -> SafetyInterceptorResult:
        if not message or not message.strip():
            return SafetyInterceptorResult(is_triggered=False)

        clean_text = message.strip()

        # Deterministic evaluation across compiled patterns
        for regex, code in self.compiled_rules:
            if regex.search(clean_text):
                # Crisis detected: formulate response and securely log without sensitive text
                now_utc = datetime.now(timezone.utc).isoformat()
                event_id = str(uuid.uuid4())
                conv_id = conversation_id or "unspecified_anonymous"

                # One-way SHA-256 hash of message for integrity & deduplication auditing (zero plain text)
                msg_hash = hashlib.sha256(clean_text.encode("utf-8")).hexdigest()

                audit_log = SafetyAuditLogEntry(
                    event_id=event_id,
                    timestamp=now_utc,
                    conversation_id=conv_id,
                    trigger_category="acute_crisis_or_self_harm",
                    trigger_code=code,
                    action_taken="intercepted_and_escalated_to_helplines",
                    message_length=len(clean_text),
                    message_sha256=msg_hash,
                    language_preference=language_pref,
                    helplines_offered=["Tele-MANAS: 14416", "Emergency: 112", "KIRAN: 1800-599-0019", "Vandrevala: +91 9999 666 555"],
                )

                # Execute secure audit logging (Privacy & DPDP Act compliant: ZERO raw message text)
                self._record_secure_audit_log(audit_log)

                template_text = CRISIS_RESPONSE_TEMPLATES.get(
                    language_pref,
                    CRISIS_RESPONSE_TEMPLATES["Hinglish"],
                )

                return SafetyInterceptorResult(
                    is_triggered=True,
                    trigger_category="acute_crisis_or_self_harm",
                    trigger_code=code,
                    crisis_response_text=template_text,
                    helplines=VERIFIED_INDIAN_HELPLINES,
                    audit_entry=audit_log,
                )

        return SafetyInterceptorResult(is_triggered=False)

    def _record_secure_audit_log(self, entry: SafetyAuditLogEntry) -> None:
        """
        Securely logs safety escalation event.
        Strict DPDP Act compliance: Never writes raw sensitive user utterances to logs.
        """
        log_payload = {
            "safety_event": "CRISIS_INTERCEPTION",
            "event_id": entry.event_id,
            "timestamp": entry.timestamp,
            "conversation_id": entry.conversation_id,
            "trigger_category": entry.trigger_category,
            "trigger_code": entry.trigger_code,
            "action": entry.action_taken,
            "message_length": entry.message_length,
            "message_hash": entry.message_sha256,
            "language": entry.language_preference,
            "helplines_provided_count": len(entry.helplines_offered),
        }
        # Log as structured JSON at WARNING level
        logger.warning(json.dumps(log_payload))


# Global singleton instance
safety_interceptor = DeterministicSafetyInterceptor()
