import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// Meta calls this endpoint with hub.mode, hub.verify_token and hub.challenge
// when validating the webhook subscription.
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (!expectedToken) {
    return NextResponse.json({ error: "Webhook verification token is not configured." }, { status: 500 });
  }

  if (mode === "subscribe" && token && safeEqual(token, expectedToken) && challenge) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
}

// Verify Meta's X-Hub-Signature-256 before accepting production notifications.
export async function POST(request: NextRequest) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json({ error: "META_APP_SECRET is not configured." }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") || "";
  const expectedSignature = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");

  if (!signature || !safeEqual(signature, expectedSignature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  // Acknowledge valid notifications. Do not log message contents or customer data.
  // Order/status automation can be added after the webhook subscription is verified.
  console.info("WhatsApp webhook event received", {
    object: typeof payload === "object" && payload !== null && "object" in payload
      ? (payload as { object?: unknown }).object
      : undefined,
    entries: typeof payload === "object" && payload !== null && "entry" in payload && Array.isArray((payload as { entry?: unknown }).entry)
      ? (payload as { entry: unknown[] }).entry.length
      : 0,
  });

  return NextResponse.json({ received: true }, { status: 200 });
}
