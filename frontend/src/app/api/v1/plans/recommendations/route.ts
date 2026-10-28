import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";
  const limit = searchParams.get("limit") || "2";
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  try {
    const res = await fetch(
      `${backendUrl}/v1/plans/recommendations?category=${encodeURIComponent(category)}&limit=${limit}`,
      {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (e) {
    console.warn("Backend plans endpoint unreachable, using fallback recommendations:", e);
  }

  // Graceful fallback recommendations
  const fallbackRecommendations = [
    {
      id: "box_breathing_pranayama",
      title: "4-4-4 Box Breathing (Pranayama Reset)",
      duration_minutes: 2,
      evidence_rationale: "Activates the parasympathetic vagus nerve, reducing acute cortisol and panic before studying or exams.",
      category: category || "academic_stress",
      instructions: [
        "Sit with a relaxed spine, inhale slowly through your nose for 4 counts.",
        "Hold your breath gently without straining for 4 counts.",
        "Exhale smoothly through your mouth for 4 counts, then pause for 4 counts. Repeat 4 cycles.",
      ],
      status: "skipped",
    },
    {
      id: "one_micro_task_box",
      title: "The 10-Minute 'One Micro-Task' Box",
      duration_minutes: 10,
      evidence_rationale: "Cognitive overload occurs when viewing the entire syllabus; isolating 1 atomic task breaks executive paralysis.",
      category: category || "academic_stress",
      instructions: [
        "Pick exactly ONE 10-minute task (e.g. read 2 pages or solve 1 problem).",
        "Set a gentle 10-minute timer and silence your phone.",
        "When the timer rings, give yourself permission to stop or take a 3-minute stretch.",
      ],
      status: "skipped",
    },
  ];

  return NextResponse.json(fallbackRecommendations);
}
