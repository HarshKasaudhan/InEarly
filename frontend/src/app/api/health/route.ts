import { NextResponse } from "next/server";

const START_TIME = Date.now();

export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Optional: check backend health connectivity
  let backendStatus = "unknown";
  try {
    const res = await fetch(`${backendUrl}/health`, {
      method: "GET",
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(2000),
    });
    backendStatus = res.ok ? "connected" : `error_${res.status}`;
  } catch (error) {
    backendStatus = "unreachable";
  }

  return NextResponse.json(
    {
      status: "healthy",
      service: "inearly-frontend",
      uptime_seconds: uptimeSeconds,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      integrations: {
        backend_api: {
          url: backendUrl,
          status: backendStatus,
        },
        supabase: {
          configured: Boolean(
            process.env.NEXT_PUBLIC_SUPABASE_URL &&
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ),
        },
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}
