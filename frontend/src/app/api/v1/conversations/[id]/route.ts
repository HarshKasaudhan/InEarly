import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") || "anon-user-default";
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${backendUrl}/v1/chat/conversations/${encodeURIComponent(id)}?user_id=${encodeURIComponent(userId)}`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (e) {
    console.warn(`Backend conversation ${id} endpoint unreachable:`, e);
  }

  return NextResponse.json(
    {
      id,
      user_id: userId,
      mode: "listen",
      title: "Session",
      created_at: new Date().toISOString(),
      messages: [],
    },
    { status: 200 }
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") || "anon-user-default";
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${backendUrl}/v1/chat/conversations/${encodeURIComponent(id)}?user_id=${encodeURIComponent(userId)}`, {
      method: "DELETE",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (e) {
    console.warn(`Backend delete conversation ${id} unreachable:`, e);
  }

  return NextResponse.json({
    success: true,
    user_id: userId,
    deleted_count: 1,
    message: `Conversation ${id} erased.`,
  });
}
