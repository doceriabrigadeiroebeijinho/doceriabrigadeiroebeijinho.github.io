import { NextResponse } from "next/server";

type OrderRequestBody = {
  orderCode?: string;
  name?: string;
  phone?: string;
  birthDate?: string | null;
  eventDate?: string;
  eventTime?: string;
  service?: string;
  address?: string;
  items?: Array<{
    name?: string;
    variant?: string;
    type?: string;
    quantity?: number;
    totalCents?: number;
  }>;
  totalCents?: number;
  paymentMethod?: string;
  planPaymentMode?: string | null;
  planTermsAccepted?: boolean;
  summary?: {
    productsCents?: number;
    couponCode?: string;
    couponDiscountCents?: number;
    pixDiscountCents?: number;
    deliveryCents?: number;
    totalCents?: number;
    depositCents?: number;
    balanceCents?: number;
    planCents?: number;
    balancePaymentMethod?: string;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderRequestBody;

    const {
      orderCode,
      name,
      phone,
      birthDate,
      eventDate,
      eventTime,
      service,
      address,
      items,
      totalCents,
      paymentMethod,
      planPaymentMode,
      planTermsAccepted,
      summary,
    } = body;

    // Nome e WhatsApp são obrigatórios
    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Nome e WhatsApp são obrigatórios.",
        },
        { status: 400 },
      );
    }

    const generatedOrderCode =
      orderCode?.trim() || `BB-${Date.now().toString().slice(-6)}`;

    let scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();

    if (!scriptUrl) {
      console.error(
        "A variável GOOGLE_APPS_SCRIPT_URL não está configurada.",
      );

      return NextResponse.json(
        {
          success: false,
          error: "A integração com a planilha não está configurada.",
        },
        { status: 500 },
      );
    }

    // Corrige a URL do Google Apps Script
    if (scriptUrl.includes("/edit")) {
      scriptUrl = `${scriptUrl.split("/edit")[0]}/exec`;
    } else if (!scriptUrl.endsWith("/exec")) {
      scriptUrl = `${scriptUrl.replace(/\/$/, "")}/exec`;
    }

    const scriptResponse = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action: "new-order",

        // O Apps Script recebe esse valor como payload.token
        token: process.env.GOOGLE_APPS_SCRIPT_SECRET,

        createdAt: new Date().toISOString(),
        orderCode: generatedOrderCode,
        name: name.trim(),
        phone: phone.trim(),
        birthDate: birthDate || null,
        eventDate: eventDate || "",
        eventTime: eventTime || "",
        service: service || "",
        address: address || "",
        items: items || [],
        totalCents: totalCents || 0,
        paymentMethod: paymentMethod || "",
        planPaymentMode: planPaymentMode || null,
        planTermsAccepted: Boolean(planTermsAccepted),

        summary: {
          productsCents: summary?.productsCents || 0,
          couponCode: summary?.couponCode || "",
          couponDiscountCents: summary?.couponDiscountCents || 0,
          pixDiscountCents: summary?.pixDiscountCents || 0,
          deliveryCents: summary?.deliveryCents || 0,
          totalCents: summary?.totalCents || totalCents || 0,
          depositCents: summary?.depositCents || 0,
          balanceCents: summary?.balanceCents || 0,
          planCents: summary?.planCents || 0,
          balancePaymentMethod:
            summary?.balancePaymentMethod || "",
        },
      }),
      redirect: "follow",
      cache: "no-store",
    });

    const responseText = await scriptResponse.text();

    let scriptResult: {
      ok?: boolean;
      error?: string;
    } = {};

    try {
      scriptResult = JSON.parse(responseText);
    } catch {
      console.error(
        "Resposta inválida do Google Apps Script:",
        responseText,
      );
    }

    if (!scriptResponse.ok || scriptResult.ok !== true) {
      console.error(
        "Erro retornado pelo Google Apps Script:",
        scriptResult.error || responseText,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            scriptResult.error ||
            "Não foi possível salvar o pedido na planilha.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      orderCode: generatedOrderCode,
    });
  } catch (error: unknown) {
    console.error("Erro na rota de cadastro:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível processar o cadastro.",
      },
      { status: 500 },
    );
  }
}
