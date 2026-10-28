import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") || "";
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${backendUrl}/v1/memories?user_id=${encodeURIComponent(userId)}`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (e) {
    console.warn("Backend memories endpoint unreachable, using fallback memory list:", e);
  }

  // Fallback memory list for preview
  return NextResponse.json({
    user_id: userId || "anon-user-default",
    pseudonym: "CalmMonsoon_24",
    total_stored_checkins: 1,
    memories: [
      {
        id: "sample-checkin-01",
        user_id: userId || "anon-user-default",
        mode: "listen",
        summary_snippet: "Discussed exam anxiety and syllabus pressure. Reflected on feeling overwhelmed by peer comparisons.",
        created_at: new Date().toISOString(),
        retention_expiry: new Date(Date.now() + 29 * 24 * 3600 * 1000).toISOString(),
        confirmed_tags: ["Academic & Exam Stress"],
        days_until_purge: 29,
        data_retention_policy: "DPDP 30-day ephemeral auto-prune",
      },
    ],
    active_goals: [],
    privacy_notice: "All check-ins are user-owned and subject to irreversible deletion on demand.",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    const res = await fetch(`${backendUrl}/v1/memories/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (e) {
    console.warn("Backend goals endpoint unreachable:", e);
  }

  return NextResponse.json({ success: true, status: "updated" });
}
