import asyncio
import json
import logging
import random
import re
from typing import List, Tuple, Optional, Dict, Any
from app.core.config import settings
from app.schemas.chat import ChatMode, ChatMessage, ConcernTagItem

logger = logging.getLogger("inearly.agents")

# Google GenAI SDK Import
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-genai library not available, will use Groq or resilient engine.")

# Groq SDK Import (Llama-3 fallback)
try:
    from groq import AsyncGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    logger.warning("groq library not available, will use simulated resilient engine.")


CRISIS_PATTERNS = [
    r"\b(suicide|kill(ing)?\s*myself|end(ing)?\s*my\s*life|want(ing)?\s*to\s*die|self[-\s]?harm|cut(ting)?\s*my\s*wrist|not\s*worth\s*living|better\s*off\s*dead)\b",
    r"\b(khatam\s*karna\s*chahta|jaan\s*(de\s*dunga|lene)|marne\s*ka\s*mann|aatmhatya|kudkushi)\b",
]

CRISIS_RESOURCES = [
    "Tele-MANAS (Govt. of India 24/7 Toll-Free Mental Health Helpline): 14416 or 1800-891-4416",
    "KIRAN (National Mental Health Helpline): 1800-599-0019",
    "Vandrevala Foundation (24/7 Free Counseling): +91 9999 666 555",
    "Emergency Services (National Emergency Number): 112",
]

CONCERN_TAXONOMY = {
    "academic_stress": {
        "label": "Academic & Exam Stress",
        "keywords": ["exam", "study", "marks", "grade", "college", "jee", "neet", "upsc", "backlog", "placement", "syllabus", "padhai", "cgpa"],
    },
    "heartbreak_grief": {
        "label": "Heartbreak & Relationship Grief",
        "keywords": ["breakup", "broke up", "heartbreak", "ex", "ghosted", "cheated", "relationship", "partner", "dumped", "chhod diya", "dil toot gaya"],
    },
    "career_uncertainty": {
        "label": "Career Uncertainty & Imposter Fear",
        "keywords": ["career", "job", "interview", "resume", "layoff", "promotion", "naukri", "future", "ambition", "unemployed", "unplaced", "offer"],
    },
    "sleep_concern": {
        "label": "Sleep & Insomnia",
        "keywords": ["sleep", "insomnia", "awake", "night", "overthinking", "neend", "so nahi", "restless", "nightmare", "midnight"],
    },
    "workplace_burnout": {
        "label": "Workplace Burnout",
        "keywords": ["work", "boss", "manager", "burnout", "exhausted", "corporate", "office", "deadline", "shift", "overtime", "wfh"],
    },
    "family_expectations": {
        "label": "Family Pressure & Expectations",
        "keywords": ["parents", "family", "mom", "dad", "shadi", "marriage", "expectation", "gharwale", "comparisons", "relatives", "papa", "mummy"],
    },
    "loneliness": {
        "label": "Loneliness & Isolation",
        "keywords": ["lonely", "alone", "isolated", "akela", "kisi se baat", "no friends", "new city", "hostel", "pg", "alienated", "nobody cares"],
    },
    "general_overwhelm": {
        "label": "General Overwhelm & Fatigue",
        "keywords": ["overwhelmed", "heavy", "tired", "anxious", "stress", "tension", "parreshaan", "ghabrahat", "exhausted", "numb"],
    },
}


def build_empathy_system_prompt(
    mode: ChatMode,
    language_pref: str,
    age_band: str,
    emotional_context: Optional[str] = None,
) -> str:
    """
    Constructs an advanced, emotionally intelligent, non-repetitive system prompt for Inearly.
    Incorporates deep Indian cultural grounding, contextual acknowledgment, and anti-looping constraints.
    """
    
    prompt = (
        "You are 'Inearly' — a warm, highly empathetic, and culturally attuned AI mental wellness companion tailored specifically for India.\n"
        "Your purpose is to provide an emotionally safe, non-judgmental sanctuary where users feel genuinely heard, validated, and gently supported.\n\n"
        
        "### 1. CORE PERSONA & EMOTIONAL INTELLIGENCE:\n"
        "- Act like an emotionally wise, grounded, and caring confidant who truly understands human vulnerability.\n"
        "- ACTIVELY ANALYZE & NAME THE PAIN POINT: In your very first sentence, directly reflect and unpack the specific nuance of what the user is experiencing (e.g. career rejection, academic panic, heartbreak grief, parental comparison, late-night insomnia, or hostel loneliness).\n"
        "- NEVER USE GENERIC CANNED RESPONSES: Do NOT repeat generic boilerplate lines like 'I hear you deeply', 'Overwhelm hona bilkul natural hai', 'I'm so sorry you're going through this', or 'Everything happens for a reason'. Dynamically vary your vocabulary, empathy hooks, and sentence structures.\n"
        "- AVOID TOXIC POSITIVITY & HOLLOW CLICHÉS: Never dismiss pain with 'Stay positive', 'Cheer up', or 'Time heals everything'. Meet them in their present emotional reality with honesty and compassion.\n"
        "- NO CLINICAL DIAGNOSIS: Never diagnose medical/psychiatric conditions (e.g. 'You have severe clinical depression'). You are an empathetic companion and active listener, not a prescribing psychiatrist.\n\n"

        "### 2. INDIAN CULTURAL & DEMOGRAPHIC ATTUNEMENT:\n"
        "- Understand the lived reality of Indian youth and young professionals:\n"
        "  * Academic hyper-competitiveness: JEE, NEET, UPSC, college CGPA, placement season anxiety, backlogs, and fear of 'falling behind' peers.\n"
        "  * Career imposter syndrome: Software/corporate grind, layoff dread, unplaced guilt, comparison with Sharma ji ka beta or batchmates on LinkedIn.\n"
        "  * Heartbreak & dating in India: Intense relationship grief, sudden ghosting, inter-caste/family compatibility friction, and lack of safe spaces to vent about dating.\n"
        "  * Family duty & emotional debt: Guilt over parents' financial sacrifices, marriage pressures, societal reputation ('log kya kahenge'), and boundary struggles.\n"
        "  * Relocation loneliness: Isolation in PGs/hostels across tech hubs (Bengaluru, Pune, Gurgaon, Hyderabad, Mumbai, Noida).\n"
        f"- The user's age demographic is '{age_band}'. Calibrate your tone respectfully to their life phase.\n\n"

        "### 3. LANGUAGE & NATURAL CONVERSATIONAL CODE-SWITCHING:\n"
        f"- The user has selected '{language_pref}'.\n"
        "  * If 'Hinglish': Speak in contemporary, natural urban Indian Hinglish (e.g. 'Placement season ke time pe peer comparison aur uncertainty sach mein mind ko drain kar deti hai... Dil par itna load lena natural hai, par aap akele nahi hain'). Avoid robotic translated Hindi.\n"
        "  * If 'Hindi': Respond in warm, respectful, natural Hindi (Devanagari script) with heartfelt empathy.\n"
        "  * If 'English': Respond in articulate, grounded, human, and gentle English.\n\n"

        "### 4. CONTEXT MEMORY & SESSION CONTINUITY:\n"
        "- You are provided with the ongoing conversation history. ACTIVELY REFERENCE what the user mentioned in previous turns (e.g. specific exams, their partner's name or breakup details, job interviews, or previous nights of insomnia).\n"
        "- Do NOT ask them to repeat facts they have already shared. Bridge past context smoothly.\n\n"
    )

    if mode == ChatMode.LISTEN:
        prompt += (
            "### 5. ACTIVE MODE: 'JUST LISTEN' (Venting, Validation & Emotional Holding):\n"
            "- The user explicitly wants a space to vent without receiving unsolicited advice or task lists.\n"
            "- Provide 100% emotional containment, reflective mirroring, and gentle empathy.\n"
            "- Do NOT give 5-step solutions, habits, or productivity tips in this mode.\n"
            "- Validate why their feelings make total sense given what they are carrying.\n"
            "- End with ONE gentle, low-pressure question encouraging them to express what feels heaviest (e.g. 'Agar aap khulkar batana chahein, to is waqt sabse zyada kya hurt kar raha hai?').\n"
            "- Keep length moderate: 3 to 5 thoughtful, beautifully crafted sentences.\n"
        )
    else:  # Plan Mode
        prompt += (
            "### 5. ACTIVE MODE: 'HELP ME PLAN' (Structured, Gentle & Realistic Coping):\n"
            "- The user wants collaborative, actionable guidance to regain a sense of agency and calm.\n"
            "- Structure your response with soothing pacing:\n"
            "  1. EMPATHETIC VALIDATION (1-2 sentences): Acknowledge their situation and connect with their prior context.\n"
            "  2. EXACTLY ONE OR TWO REALISTIC MICRO-STEPS (manageable, low-friction, somatic or cognitive actions tailored specifically to their issue):\n"
            "     * E.g., The 2-minute 4-4-4 Pranayama breathing to downregulate cortisol before panic.\n"
            "     * E.g., The 10-Minute 'One Micro-Task' Box (pick 1 atomic page or bug, ignore the rest of the syllabus/backlog for 10 minutes).\n"
            "     * E.g., Unsent Expressive Writing (pour raw anger or heartbreak into notes for 5 minutes then step away).\n"
            "     * E.g., Somatic 5-4-3-2-1 Grounding anchor for racing panic thoughts.\n"
            "  3. COLLABORATIVE CHECK-IN (1 sentence): Ask how that small step resonates with them right now, keeping zero pressure.\n"
            "- Avoid huge overwhelming checklists. Keep it gentle, realistic, and moderate.\n"
        )

    if emotional_context:
        prompt += (
            f"\n\n### 4. REAL-TIME MULTIMODAL FACIAL AFFECT CONTEXT (Consented Vision Sensor Insight):\n"
            f"- Telemetry & Anti-Spoofing Status: {emotional_context}\n"
            f"- Real-Time Psychological Attunement Directives:\n"
            f"  * Subtly calibrate your tone, cadence, and empathy depth based on the user's live affective presence.\n"
            f"  * If sadness, vulnerability, or low mood is perceived: offer softer pacing, deep emotional validation, and unconditional warmth.\n"
            f"  * If anxiety, fear, or overwhelm is perceived: provide soothing grounding, slow down explanations, and prioritize vagal calm.\n"
            f"  * If calm, positive, or steady receptivity is perceived: mirror their clarity, reinforce small wins, and foster gentle forward momentum.\n"
            f"  * DO NOT say 'My camera detected that you look sad' or disclose raw sensor percentages robotically. Weave your attunement seamlessly into your words."
        )

    return prompt


def detect_crisis(message: str) -> bool:
    """Checks for acute crisis or self-harm markers."""
    for pattern in CRISIS_PATTERNS:
        if re.search(pattern, message, re.IGNORECASE):
            return True
    return False


def classify_concerns_rule_based(message: str) -> List[ConcernTagItem]:
    """A2 Concern Classifier: Extracts tentative themes with uncertainty flags."""
    msg_lower = message.lower()
    matched_tags: List[ConcernTagItem] = []

    for cat_key, info in CONCERN_TAXONOMY.items():
        matches = [kw for kw in info["keywords"] if re.search(rf"\b{re.escape(kw)}\b", msg_lower)]
        if matches:
            confidence = min(0.65 + (len(matches) * 0.15), 0.95)
            matched_tags.append(
                ConcernTagItem(
                    category=cat_key,
                    display_label=info["label"],
                    tentative_flag=True,
                    confidence=round(confidence, 2),
                    user_confirmed=False,
                )
            )

    if not matched_tags and len(message.split()) > 3:
        matched_tags.append(
            ConcernTagItem(
                category="general_overwhelm",
                display_label="General Overwhelm",
                tentative_flag=True,
                confidence=0.60,
                user_confirmed=False,
            )
        )

    return matched_tags[:3]


class AgentOrchestrator:
    """
    Multi-Model Conversational Orchestrator for Inearly:
    1. Gemini 2.5 Flash as primary LLM
    2. Groq Llama 3 (e.g. llama-3.3-70b-versatile) as seamless fast fallback
    3. Advanced dynamic contextual empathy engine for complete offline resilience
    """

    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.gemini_model = settings.GEMINI_MODEL
        self.groq_key = settings.GROQ_API_KEY
        self.groq_model = settings.GROQ_MODEL
        
        self._gemini_client = None
        self._groq_client = None

        # Initialize Gemini Client if key available
        if self.gemini_key and GENAI_AVAILABLE and not self.gemini_key.startswith("your-"):
            try:
                self._gemini_client = genai.Client(api_key=self.gemini_key)
                logger.info(f"Gemini client initialized successfully (model: {self.gemini_model})")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini client: {e}")

        # Initialize Groq Client if key available
        if self.groq_key and GROQ_AVAILABLE and not self.groq_key.startswith("your-"):
            try:
                self._groq_client = AsyncGroq(api_key=self.groq_key)
                logger.info(f"Groq fallback client initialized successfully (model: {self.groq_model})")
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")

    async def _invoke_gemini(
        self,
        system_prompt: str,
        message: str,
        history: List[ChatMessage],
    ) -> Optional[str]:
        """Calls Gemini API with sliding context window and timeout guard."""
        if not self._gemini_client:
            return None

        try:
            # Build sliding window of last 10 messages, preserving user/model alternation
            formatted_contents = []
            recent_history = history[-10:] if history else []

            for h in recent_history:
                role = "user" if h.role.value == "user" else "model"
                formatted_contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=h.content)]
                    )
                )

            # Append current user prompt
            formatted_contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=message)]
                )
            )

            # Run in worker thread to prevent blocking event loop with 8-second timeout
            def _sync_gemini_call():
                return self._gemini_client.models.generate_content(
                    model=self.gemini_model,
                    contents=formatted_contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.75,
                        max_output_tokens=650,
                    ),
                )

            response = await asyncio.wait_for(
                asyncio.to_thread(_sync_gemini_call),
                timeout=8.0
            )

            text = response.text.strip() if response and response.text else ""
            if len(text) > 10:
                return text
        except Exception as e:
            logger.warning(f"Gemini generation failed or timed out: {e}")

        return None

    async def _invoke_groq(
        self,
        system_prompt: str,
        message: str,
        history: List[ChatMessage],
    ) -> Optional[str]:
        """Calls Groq API (Llama 3) as high-speed multi-model fallback."""
        if not self._groq_client:
            return None

        try:
            groq_messages = [{"role": "system", "content": system_prompt}]
            recent_history = history[-10:] if history else []

            for h in recent_history:
                role = "user" if h.role.value == "user" else "assistant"
                groq_messages.append({"role": role, "content": h.content})

            groq_messages.append({"role": "user", "content": message})

            response = await asyncio.wait_for(
                self._groq_client.chat.completions.create(
                    model=self.groq_model,
                    messages=groq_messages,
                    temperature=0.72,
                    max_tokens=650,
                ),
                timeout=8.0
            )

            text = response.choices[0].message.content.strip() if response.choices else ""
            if len(text) > 10:
                return text
        except Exception as e:
            logger.warning(f"Groq Llama-3 generation failed or timed out: {e}")

        return None

    async def generate_response(
        self,
        message: str,
        history: List[ChatMessage],
        mode: ChatMode,
        language_pref: str,
        age_band: str = "18-24",
        emotional_context: Optional[str] = None,
    ) -> Tuple[str, List[ConcernTagItem], bool, List[str], str]:
        # 1. Safety Guardrail Check
        if detect_crisis(message):
            crisis_reply = (
                "Main sun raha hoon aur aapki suraksha hamare liye sabse zaroori hai. "
                "Aap bilkul akele nahi hain. Kripya turant niche diye gaye helpline par connect karein. "
                "Ye 24/7 free aur confidential hain:"
                if language_pref in ["Hindi", "Hinglish"]
                else "I hear how much pain you're in, and your safety is the absolute highest priority. "
                "You don't have to carry this alone. Please reach out immediately to these free, confidential 24/7 helplines:"
            )
            tags = [
                ConcernTagItem(
                    category="acute_distress",
                    display_label="Acute Support Needed",
                    tentative_flag=True,
                    confidence=1.0,
                    user_confirmed=False,
                )
            ]
            return crisis_reply, tags, True, CRISIS_RESOURCES, "safety-guardrail"

        # 2. A2 Concern Classifier
        tentative_tags = classify_concerns_rule_based(message)

        # 3. Construct Advanced System Prompt (Including multimodal affective context)
        system_prompt = build_empathy_system_prompt(mode, language_pref, age_band, emotional_context)

        # 4. Multi-Model Fallback Pipeline
        # Step A: Primary - Gemini API
        reply = await self._invoke_gemini(system_prompt, message, history)
        if reply:
            return reply, tentative_tags, False, [], self.gemini_model

        # Step B: Secondary Fallback - Groq Llama 3
        logger.info("Attempting Groq Llama 3 multi-model fallback...")
        reply = await self._invoke_groq(system_prompt, message, history)
        if reply:
            return reply, tentative_tags, False, [], f"groq-{self.groq_model}"

        # Step C: Tertiary High-Availability Contextual Empathy Engine
        logger.info("Engaging Inearly contextual dynamic empathy engine...")
        reply = self._generate_intelligent_fallback(message, history, mode, language_pref)
        return reply, tentative_tags, False, [], "inearly-contextual-engine"

    def _generate_intelligent_fallback(
        self,
        message: str,
        history: List[ChatMessage],
        mode: ChatMode,
        language_pref: str
    ) -> str:
        """
        Dynamic, non-repetitive contextual empathy engine.
        Actively analyzes the user's specific pain point (Heartbreak, Career, Exams, Loneliness, Family, Sleep, Burnout)
        and weaves past context memory so it never loops generic canned phrases.
        """
        msg_lower = message.lower()

        # 1. Detect prior conversational context from history
        prior_context_topics = []
        if history:
            for h in history[-8:]:
                if h.role.value == "user":
                    txt = h.content.lower()
                    if any(w in txt for w in ["exam", "padhai", "marks", "jee", "neet", "cgpa", "backlog"]):
                        prior_context_topics.append("exams & academic workload")
                    elif any(w in txt for w in ["breakup", "heartbreak", "ex", "ghosted", "relationship", "chhod"]):
                        prior_context_topics.append("heartbreak & emotional grief")
                    elif any(w in txt for w in ["career", "job", "interview", "unplaced", "future", "placement"]):
                        prior_context_topics.append("career uncertainty")
                    elif any(w in txt for w in ["sleep", "neend", "insomnia", "night", "awake"]):
                        prior_context_topics.append("sleep struggles")
                    elif any(w in txt for w in ["parents", "family", "gharwale", "papa", "mummy", "shadi"]):
                        prior_context_topics.append("family expectations")

        prior_topic = prior_context_topics[-1] if prior_context_topics else None

        # Context bridges
        bridge_hinglish = [
            f"Pehele jo aapne {prior_topic} ke baare mein share kiya tha, uske saath yeh sab sambhalna ",
            f"Connecting back to what you mentioned about {prior_topic}, ",
            f"Aapne pehle bhi {prior_topic} ka stress mention kiya tha—",
        ] if prior_topic else ["", "", ""]

        bridge_hindi = [
            f"जैसा कि आपने पहले {prior_topic} के तनाव का जिक्र किया था, ",
            f"पहले की बात को जोड़ते हुए, ",
            f"यह देखते हुए कि आप पहले से {prior_topic} का बोझ संभाल रहे हैं, ",
        ] if prior_topic else ["", "", ""]

        bridge_en = [
            f"Connecting this with what you mentioned earlier about {prior_topic}, ",
            f"Bearing in mind the weight of {prior_topic} you shared before, ",
            f"Reflecting back on {prior_topic}, ",
        ] if prior_topic else ["", "", ""]

        b_hing = random.choice(bridge_hinglish)
        b_hi = random.choice(bridge_hindi)
        b_en = random.choice(bridge_en)

        # 2. Check for Specific Emotional Pain Points

        # === THEME: HEARTBREAK & RELATIONSHIPS ===
        if any(w in msg_lower for w in ["breakup", "broke up", "heartbreak", "ex", "ghosted", "cheated", "partner", "chhod diya", "dil toot"]):
            if mode == ChatMode.LISTEN:
                if language_pref == "Hindi":
                    options = [
                        f"{b_hi}किसी ऐसे इंसान से अलग होना जिसने आपकी जिंदगी में इतनी जगह ले रखी थी, एक बहुत गहरा और असहनीय दर्द छोड़ जाता है। ऐसा लगता है जैसे अचानक सब कुछ खाली हो गया हो। आप इस वक्त कैसा महसूस कर रहे हैं?",
                        f"{b_hi}दिल टूटने का यह दर्द सच में बहुत शारीरिक और मानसिक चोट जैसा महसूस कराता है। खुद पर कोई दबाव मत डालिए। क्या आप बताना चाहेंगे कि इस वक्त सबसे ज्यादा क्या याद आ रहा है?"
                    ]
                    return random.choice(options)
                elif language_pref == "Hinglish":
                    options = [
                        f"{b_hing}breakup aur heartbreak ka dard sach mein bohot personal aur sharp hota hai. Ek taraf memories ka storm hota hai aur dusri taraf sudden silence. Dil par jo guzar rahi hai, bina filter ke share kar sakte hain—sabse zyada kya hurt kar raha hai?",
                        f"{b_hing}kisi aise insaan ka sudden distance jis par aapne itna trust kiya tha, self-doubt aur emptiness create kar deta hai. Aise waqt pe apne emotions ko dabaane ki zaroorat nahi hai. Main yahan sun raha hoon, jo mann mein ho keh daaliye."
                    ]
                    return random.choice(options)
                else:
                    return f"{b_en}heartbreak has a way of turning everything upside down. The sudden absence and the weight of memories can feel physically exhausting. I'm right here with you—what part of this feels heaviest right now?"

            else:  # Plan Mode for Heartbreak
                if language_pref == "Hinglish":
                    return (
                        f"{b_hing}dil tootne ke dard mein ek saath sab theek nahi hota, par hum 2 gentle, low-pressure steps le sakte hain:\n\n"
                        "1. Emotional Drain Release (Unsent Note): Kisi private notepad par jo bhi gussa, dard ya baatein adhuri reh gayi hain, bina filter ke 5 minute likh daaliye, aur phir app close kar dijiye.\n"
                        "2. Somatic Pause (Cold Water Reset): Apne chehre par thanda paani splash karein taaki acute emotional adrenaline thoda calm ho sake.\n\n"
                        "Kya yeh pehla chhota sa kadam abhi try karna doable lag raha hai?"
                    )
                elif language_pref == "Hindi":
                    return (
                        f"{b_hi}आइए इस गहरे दर्द को 2 बहुत छोटे, सहज कदमों में संभालते हैं:\n\n"
                        "1. 5-मिनट अनसेंड राइटिंग: जो भी बात या गुस्सा आपके सीने में अटका है, उसे एक डायरी में लिख डालिए और फिर पन्ना पलट दीजिए।\n"
                        "2. शीतल जल स्पर्श: चेहरे पर ठंडे पानी के छींटे मारें ताकि तंत्रिका तंत्र का तीव्र दर्द थोड़ा शांत हो सके।\n\n"
                        "क्या यह छोटा सा प्रयास आपके लिए अभी ठीक रहेगा?"
                    )
                else:
                    return (
                        f"{b_en}healing from this takes time, but we can take 2 gentle, low-pressure micro-steps:\n\n"
                        "1. 5-Minute Unsent Letter: Pour out whatever unresolved thoughts or hurt are circulating in your mind onto a blank note, then close it.\n"
                        "2. Cold Water Reset: Splash cool water on your face to activate the mammalian dive reflex and settle intense emotional arousal.\n\n"
                        "Would it feel alright to take that first tiny step right now?"
                    )

        # === THEME: CAREER, INTERVIEWS & PLACEMENTS ===
        if any(w in msg_lower for w in ["career", "job", "interview", "placement", "unplaced", "unemployed", "naukri", "resume", "layoff"]):
            if mode == ChatMode.LISTEN:
                if language_pref == "Hindi":
                    return f"{b_hi}कैरियर की अनिश्चितता और साथियों के साथ तुलना का यह दबाव सच में बहुत भारी और अकेला कर देने वाला होता है। जब हर तरफ ऑफर्स की बातें हो रही हों, तो खुद पर संदेह होना स्वाभाविक है। इस वक्त आपके मन में क्या चल रहा है?"
                elif language_pref == "Hinglish":
                    return f"{b_hing}career aur placement season ka uncertainty bohot overwhelming hoti hai. Jab har koi LinkedIn par updates daal raha ho, to lagta hai ki hum peeche chhoot rahe hain. Par aapki value ek interview ya offer se decide nahi hoti. Jo bhi darr hai, khulkar batayein."
                else:
                    return f"{b_en}career uncertainty and the constant comparison game during hiring seasons can be deeply draining. It makes complete sense that you're feeling on edge. What's the biggest worry on your mind regarding this?"
            else:
                if language_pref == "Hinglish":
                    return (
                        f"{b_hing}chaliye career ke is burden ko 2 focused, actionable micro-steps mein divide karte hain:\n\n"
                        "1. The 10-Minute Single Task Box: Pura career ya 50 job openings mat dekhein—bas agle 10 minute mein ek single resume section ya company shortlist par dhyan dein.\n"
                        "2. LinkedIn/Social Media Blackout: Agle 4 ghante ke liye job brag posts aur updates dekhna band karein taaki comparison loop break ho sake.\n\n"
                        "Kya yeh 10-minute ka focus box try karna comfortable lagega?"
                    )
                else:
                    return (
                        f"{b_en}let's compartmentalize this career stress into 2 manageable actions:\n\n"
                        "1. The 10-Minute 'One Task' Window: Disregard the overall backlog. Dedicate just 10 minutes to refining one bullet point or reaching out to one contact.\n"
                        "2. Comparison Detox: Step away from professional social feeds for the next few hours to protect your mental energy.\n\n"
                        "How does taking that single 10-minute step feel to you?"
                    )

        # === THEME: EXAMS & ACADEMIC PRESSURE ===
        if any(w in msg_lower for w in ["exam", "padhai", "study", "marks", "jee", "neet", "syllabus", "cgpa", "backlog"]):
            if mode == ChatMode.LISTEN:
                if language_pref == "Hinglish":
                    return f"{b_hing}exams aur syllabus ka pahad jaisa load sach mein exhaust kar deta hai. Aisa lagta hai ki chahe kitna bhi padh lo, kuch na kuch baaki reh jata hai. Main yahan sunne ke liye hoon—sabse zyada pressure kis subject ya exam ka hai?"
                elif language_pref == "Hindi":
                    return f"{b_hi}परीक्षाओं और पढ़ाई का यह निरंतर दबाव मन को थका देता है। ऐसा महसूस होना स्वाभाविक है कि समय कम है और अपेक्षाएं बहुत ज्यादा। क्या सबसे ज्यादा परेशान कर रहा है?"
                else:
                    return f"{b_en}academic pressure and exam timelines can make you feel like you're constantly running against the clock. Take a breath—I'm listening. Which part of the preparation is weighing on you most?"
            else:
                if language_pref == "Hinglish":
                    return (
                        f"{b_hing}is academic panic ko todne ke liye 2 practical micro-steps start karte hain:\n\n"
                        "1. 2-Minute Box Breathing: 4 counts inhale, 4 counts hold, aur 4 counts smooth exhale karein taaki brain ka fight-or-flight mode calm ho sake.\n"
                        "2. Micro-Portion Rule: Pura syllabus chhod kar sirf agle 15 minute ke liye 1 topic ya 2 pages padhein.\n\n"
                        "Kya hum is 2-minute breathing reset se shuru karein?"
                    )
                else:
                    return (
                        f"{b_en}let's tackle this academic overwhelm with 2 atomic steps:\n\n"
                        "1. 2-Minute 4-4-4 Pranayama Breathing: Inhale for 4, hold gently for 4, and exhale for 4 to clear brain fog.\n"
                        "2. The Micro-Portion Rule: Isolate just 1 atomic concept or 2 practice questions for 15 minutes, ignoring the rest of the syllabus.\n\n"
                        "Would you be open to trying that 2-minute breathing reset first?"
                    )

        # === THEME: LONELINESS & HOSTEL/PG ISOLATION ===
        if any(w in msg_lower for w in ["lonely", "alone", "akela", "isolated", "hostel", "pg", "new city", "no friends"]):
            if language_pref == "Hinglish":
                return f"{b_hing}kisi nayi jagah ya hostel/PG ke chaar deewari mein akelapan sach mein bohot chubhta hai. Aisa lagta hai ki aas-paas log to hain, par koi deeply connect nahi kar raha. Main poori tarah aapke saath hoon—kaisa lag raha hai is waqt?"
            elif language_pref == "Hindi":
                return f"{b_hi}अकेलापन और यह भावना कि कोई सच में आपको नहीं समझ रहा, दिल को बहुत भारी कर देती है। आप बिल्कुल अकेले नहीं हैं। जो भी आप महसूस कर रहे हैं, बेझिझक साझा करें।"
            else:
                return f"{b_en}feeling isolated or alienated, especially when living away from familiar comfort, can feel deeply hollow. You're not alone in this space—what thoughts are echoing most right now?"

        # === THEME: FAMILY EXPECTATIONS & GUILT ===
        if any(w in msg_lower for w in ["parents", "family", "gharwale", "papa", "mummy", "shadi", "relatives", "comparisons"]):
            if language_pref == "Hinglish":
                return f"{b_hing}Indian families mein expectations aur sacrifices ka load bohot complex hota hai. Ek taraf unka pyar hota hai, aur dusri taraf unke darr aur sapno ka heavy pressure. Aapka frustrate hona bilkul natural hai. Kya chal raha hai ghar par?"
            else:
                return f"{b_en}navigating family expectations and the weight of parental sacrifices in an Indian household is deeply complicated. Wanting to live your truth while not disappointing them is exhausting. What's the core conflict you're carrying?"

        # === GENERAL / VENTING DEFAULT ===
        if mode == ChatMode.LISTEN:
            if language_pref == "Hindi":
                return f"{b_hi}मैं आपकी बात बहुत आत्मीयता से सुन रहा हूँ। जो कुछ भी आप अपने भीतर दबाए हुए हैं, उसे बाहर आने दीजिए। यहाँ कोई जल्दबाजी और कोई फैसला नहीं है।"
            elif language_pref == "Hinglish":
                return f"{b_hing}main aapki baat poore mann se sun raha hoon. Aisi situation mein dil par itna load mehsus hona bilkul natural hai. Aapko yahan strong banne ki zaroorat nahi hai—jo dil mein ho, keh daaliye."
            else:
                return f"{b_en}it sounds like you are carrying a lot right now. You don't have to put on a brave face here—take all the time and space you need to express what's hurting."
        else:
            if language_pref == "Hinglish":
                return (
                    f"{b_hing}chaliye is overthinking aur heavy feeling ko 2 realistic micro-steps mein break karte hain:\n\n"
                    "1. 2-Minute Somatic Anchor: Apne dono pair zameen par flat rakhein, 3 gehri saansein lein, aur room mein 3 cheezein notice karein.\n"
                    "2. One Tiny Choice: Agle 15 minute ke liye koi ek basic task karein (jaise paani peena, stretch karna ya screen band karna).\n\n"
                    "Kya aap is pehle chote kadam ko sath mein try karna chahenge?"
                )
            else:
                return (
                    f"{b_en}let's ground this overwhelm into 2 simple, manageable micro-actions:\n\n"
                    "1. 2-Minute Somatic Anchor: Place both feet flat on the floor, take 3 slow diaphragmatic breaths, and name 3 objects you see.\n"
                    "2. One Atomic Choice: Choose one tiny physical comfort (drinking a glass of water, stretching your shoulders, or dimming harsh screens).\n\n"
                    "Would it feel okay to pause and try that small grounding breath right now?"
                )


agent_orchestrator = AgentOrchestrator()
