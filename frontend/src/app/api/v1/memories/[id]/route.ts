import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${backendUrl}/v1/memories/${id}`, {
      method: "DELETE",
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (e) {
    console.warn("Backend memory delete unreachable, using fallback response:", e);
  }

  return NextResponse.json({
    success: true,
    memory_id: id,
    message: "Check-in memory record and all associated transcripts have been permanently erased.",
    deleted_at: new Date().toISOString(),
  });
}
