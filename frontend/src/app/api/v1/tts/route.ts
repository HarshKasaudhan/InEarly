import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    // 1. Forward request to FastAPI backend ElevenLabs TTS service
    try {
      const backendRes = await fetch(`${backendUrl}/v1/tts/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: body.text,
          voice_id: body.voice_id || undefined,
        }),
        signal: AbortSignal.timeout(20000),
      });

      const contentType = backendRes.headers.get("Content-Type") || "";

      // Check if backend returned valid audio stream
      if (backendRes.ok && contentType.includes("audio/mpeg")) {
        const audioBuffer = await backendRes.arrayBuffer();
        const voiceId = backendRes.headers.get("X-Voice-Id") || "21m00Tcm4TlvDq8ikWAM";

        return new Response(audioBuffer, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": audioBuffer.byteLength.toString(),
            "X-Voice-Id": voiceId,
            "X-TTS-Status": "ok",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }

      // Backend signaled graceful fallback or returned non-audio response
      const fallbackData = await backendRes.json().catch(() => ({ fallback: true }));
      return NextResponse.json(
        {
          fallback: true,
          reason: fallbackData.reason || "upstream_fallback",
          engine: "browser_tts",
        },
        { status: 200 }
      );
    } catch (e: any) {
      console.warn("Backend TTS service unreachable, falling back to Indian browser TTS:", e.message || e);
      return NextResponse.json(
        { fallback: true, reason: "backend_unreachable", engine: "browser_tts" },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.warn("TTS route parse error, signaling client fallback:", error);
    return NextResponse.json(
      { fallback: true, reason: "invalid_payload", engine: "browser_tts" },
      { status: 200 }
    );
  }
}
