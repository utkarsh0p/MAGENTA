const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:3001";

export async function POST(request: Request) {
  const body = await request.text();

  const backendResponse = await fetch(
    `${BACKEND_API_BASE_URL}/api/workflows/chat/stream`,
    {
      method: "POST",
      headers: {
        "content-type": request.headers.get("content-type") ?? "application/json",
      },
      body,
      cache: "no-store",
    },
  );

  if (!backendResponse.ok || !backendResponse.body) {
    const errorText = await backendResponse.text().catch(() => "");

    return Response.json(
      {
        error: "Chat backend request failed",
        status: backendResponse.status,
        details: errorText || undefined,
      },
      { status: backendResponse.status || 502 },
    );
  }

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: {
      "content-type":
        backendResponse.headers.get("content-type") ??
        "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
