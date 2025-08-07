// Next.js API proxy to forward requests to the backend, avoiding browser CORS
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BACKEND =
  "https://fradema-backend-api-crguetd0f7gth9e3.brazilsouth-01.azurewebsites.net/api/v1";

function buildTargetUrl(req: NextRequest, pathSegments: string[]): string {
  const backendBase =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_BACKEND;

  const url = new URL(req.url);
  const pathname = pathSegments.join("/");
  const qs = url.search;
  // Ensure no double slashes
  return `${backendBase.replace(/\/$/, "")}/${pathname}${qs}`;
}

async function forward(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
  method: string
) {
  const params = await context.params;
  const targetUrl = buildTargetUrl(req, params.path || []);

  const headers = new Headers(req.headers);
  // Remove hop-by-hop/host specific headers that may break upstream
  headers.delete("host");
  headers.delete("accept-encoding");
  headers.delete("content-length");

  const init: RequestInit = {
    method,
    headers,
    body: ["GET", "HEAD"].includes(method)
      ? undefined
      : await req.arrayBuffer(),
    // Do not send credentials cross-origin; Authorization header is already forwarded
    // credentials: "include" // Not needed for bearer-token based API
  };

  try {
    const upstream = await fetch(targetUrl, init);

    // Stream response back preserving status and headers (except CORS)
    const responseHeaders = new Headers(upstream.headers);
    // Ensure CORS for our frontend origin
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Headers", "*");
    responseHeaders.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );

    const arrayBuffer = await upstream.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Proxy request failed",
        error: error?.message || String(error),
        targetUrl,
      },
      { status: 502 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forward(req, context, "GET");
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forward(req, context, "POST");
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forward(req, context, "PUT");
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forward(req, context, "PATCH");
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return forward(req, context, "DELETE");
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    },
  });
}
