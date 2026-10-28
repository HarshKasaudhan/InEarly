import random
from typing import List, Optional
from app.schemas.memory import WellnessRecommendation, GoalStatus

# Reviewed Evidence-Informed Resource Library
# Grounded in CBT micro-interventions, somatic regulation, and behavioral activation
WELLNESS_RESOURCE_LIBRARY: List[WellnessRecommendation] = [
    # Academic & Exam Stress
    WellnessRecommendation(
        id="box_breathing_pranayama",
        title="4-4-4 Box Breathing (Pranayama Reset)",
        duration_minutes=2,
        evidence_rationale="Activates the parasympathetic vagus nerve, reducing acute cortisol and panic before studying or exams.",
        category="academic_stress",
        instructions=[
            "Sit with a relaxed spine, inhale slowly through your nose for 4 counts.",
            "Hold your breath gently without straining for 4 counts.",
            "Exhale smoothly through your mouth for 4 counts, then pause for 4 counts. Repeat 4 cycles.",
        ],
        status=GoalStatus.SKIPPED,
    ),
    WellnessRecommendation(
        id="one_micro_task_box",
        title="The 10-Minute 'One Micro-Task' Box",
        duration_minutes=10,
        evidence_rationale="Cognitive overload occurs when viewing the entire syllabus; isolating 1 atomic task breaks executive paralysis.",
        category="academic_stress",
        instructions=[
            "Pick exactly ONE 10-minute task (e.g. read 2 pages or solve 1 problem).",
            "Set a gentle 10-minute timer and silence your phone.",
            "When the timer rings, give yourself permission to stop or take a 3-minute stretch.",
        ],
        status=GoalStatus.SKIPPED,
    ),
    # Sleep & Insomnia
    WellnessRecommendation(
        id="worry_dump_journaling",
        title="Midnight 'Brain Dump' Paper Release",
        duration_minutes=4,
        evidence_rationale="Externalizing racing thoughts to physical paper reduces cognitive arousal and pre-sleep rumination.",
        category="sleep_concern",
        instructions=[
            "Take a rough sheet of paper or notebook near your bed.",
            "Write down the 3 biggest thoughts keeping you awake right now.",
            "Tell yourself: 'These are safely written down; I cannot fix them at 2 AM. My mind is allowed to rest.'",
        ],
        status=GoalStatus.SKIPPED,
    ),
    WellnessRecommendation(
        id="screen_sunset_curfew",
        title="30-Minute Screen Sunset",
        duration_minutes=30,
        evidence_rationale="Blue light suppresses natural melatonin onset; switching to warm indirect lighting promotes circadian sleep readiness.",
        category="sleep_concern",
        instructions=[
            "Put your phone to charge away from arm's reach.",
            "Switch off harsh fluorescent overhead lights in favor of a soft lamp.",
            "Listen to calm instrumental music, white noise, or sip warm water.",
        ],
        status=GoalStatus.SKIPPED,
    ),
    # Workplace Burnout
    WellnessRecommendation(
        id="somatic_sensory_grounding",
        title="5-4-3-2-1 Sensory Room Grounding",
        duration_minutes=3,
        evidence_rationale="Somatic orientation interrupts autonomic freeze/fight states by re-anchoring awareness into physical space.",
        category="workplace_burnout",
        instructions=[
            "Notice 5 distinct colors or textures around your desk.",
            "Feel 4 physical touch points (feet on the floor, back against the chair).",
            "Identify 3 distant sounds, 2 pleasant scents, and 1 slow breath.",
        ],
        status=GoalStatus.SKIPPED,
    ),
    WellnessRecommendation(
        id="micro_boundary_pause",
        title="The 5-Minute 'No-Response' Reset",
        duration_minutes=5,
        evidence_rationale="Constant Slack/WhatsApp notification vigilance triggers chronic hyperarousal; structured micro-delays rebuild psychological safety.",
        category="workplace_burnout",
        instructions=[
            "Step away from your monitor and close your eyes for 2 minutes.",
            "Place both palms over your eyes to block visual stimulation.",
            "Give yourself permission not to reply to the next message for 5 minutes.",
        ],
        status=GoalStatus.SKIPPED,
    ),
    # General Overwhelm
    WellnessRecommendation(
        id="cool_water_facial_reset",
        title="Cool Water Vagal Splash",
        duration_minutes=1,
        evidence_rationale="Triggers the mammalian dive reflex, rapidly lowering elevated heart rate during emotional overwhelm.",
        category="general_overwhelm",
        instructions=[
            "Go to the washroom and splash cool tap water over your face 3 times.",
            "Gently press a cool damp cloth over your temples.",
            "Drink half a glass of room-temperature water slowly.",
        ],
        status=GoalStatus.SKIPPED,
    ),
]


def get_tailored_recommendations(
    category: Optional[str] = None,
    limit: int = 2,
) -> List[WellnessRecommendation]:
    """
    Returns 1-2 small, practical, evidence-informed coping steps
    tailored to the user's identified concern theme.
    """
    if category:
        matched = [r for r in WELLNESS_RESOURCE_LIBRARY if r.category == category]
        if matched:
            return matched[:limit]

    # Default fallback: General calm steps
    general = [r for r in WELLNESS_RESOURCE_LIBRARY if r.category in ["general_overwhelm", "academic_stress"]]
    return general[:limit]
