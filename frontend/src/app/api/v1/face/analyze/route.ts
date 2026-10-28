import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    if (!body.user_consent) {
      return NextResponse.json(
        {
          error: "Explicit user consent is mandatory prior to camera analysis.",
          success: false,
        },
        { status: 400 }
      );
    }

    if (!body.image_base64) {
      return NextResponse.json(
        {
          error: "Missing image frame data. Please provide base64 encoded snapshot frame.",
          success: false,
        },
        { status: 400 }
      );
    }

    const backendRes = await fetch(`${backendUrl}/v1/face/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_base64: body.image_base64,
        user_consent: Boolean(body.user_consent),
        session_id: body.session_id || undefined,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!backendRes.ok) {
      const errData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: errData.detail || `Backend error: ${backendRes.status}`,
          success: false,
        },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Face analysis API proxy error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to communicate with Face Analysis backend service.",
        success: false,
      },
      { status: 500 }
    );
  }
}
