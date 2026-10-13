import { NextResponse } from "next/server";

type AppsScriptOrdersResponse = {
  ok?: boolean;
  error?: string;
  orders?: Array<Record<string, unknown>>;
};

const APPS_SCRIPT_URL_PATTERN =
  /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec\/?$/;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const name = (requestUrl.searchParams.get("name") ?? "").trim();
  const phone = (requestUrl.searchParams.get("phone") ?? "").trim();

  if (!name || !phone) {
    return NextResponse.json(
      { success: false, error: "Informe seu nome e WhatsApp.", orders: [] },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
  const scriptSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET;

  if (!scriptUrl || !scriptSecret) {
    console.error("A integração de consulta de pedidos não está configurada.");
    return NextResponse.json(
      {
        success: false,
        error: "A consulta de pedidos está temporariamente indisponível.",
        orders: [],
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!APPS_SCRIPT_URL_PATTERN.test(scriptUrl)) {
    console.error("GOOGLE_APPS_SCRIPT_URL inválida para consultar pedidos.");
    return NextResponse.json(
      {
        success: false,
        error: "A consulta de pedidos está temporariamente indisponível.",
        orders: [],
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const endpoint = new URL(scriptUrl);
    endpoint.searchParams.set("action", "customer-orders");
    endpoint.searchParams.set("name", name);
    endpoint.searchParams.set("phone", phone);
    endpoint.searchParams.set("token", scriptSecret);

    const response = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      redirect: "follow",
    });

    const responseText = await response.text();
    let payload: AppsScriptOrdersResponse;

    try {
      payload = JSON.parse(responseText) as AppsScriptOrdersResponse;
    } catch {
      console.error(
        "Resposta não JSON ao consultar pedidos no Google Apps Script.",
      );
      return NextResponse.json(
        {
          success: false,
          error: "Não foi possível consultar seus pedidos agora.",
          orders: [],
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!response.ok || payload.ok !== true || !Array.isArray(payload.orders)) {
      console.error(
        "Falha retornada pelo Google Apps Script ao consultar pedidos.",
        payload.error ?? "Resposta inesperada",
      );
      return NextResponse.json(
        {
          success: false,
          error: "Não foi possível consultar seus pedidos agora.",
          orders: [],
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { success: true, orders: payload.orders },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Erro na consulta de pedidos:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível consultar seus pedidos agora.",
        orders: [],
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
