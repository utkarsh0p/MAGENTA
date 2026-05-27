const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:3001";

type RouteContext = {
  params: Promise<{
    authPath: string[];
  }>;
};

async function proxyAuthRequest(request: Request, context: RouteContext) {
  const { authPath } = await context.params;
  const backendUrl = `${BACKEND_API_BASE_URL}/api/auth/${authPath.join("/")}`;
  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : await request.text();

  const backendResponse = await fetch(backendUrl, {
    method: request.method,
    headers: {
      "content-type": request.headers.get("content-type") ?? "application/json",
      cookie: request.headers.get("cookie") ?? "",
    },
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const contentType = backendResponse.headers.get("content-type");
  const setCookie = backendResponse.headers.get("set-cookie");

  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }

  if (setCookie) {
    responseHeaders.set("set-cookie", setCookie);
  }

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(request: Request, context: RouteContext) {
  return proxyAuthRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxyAuthRequest(request, context);
}
