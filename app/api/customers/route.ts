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
  personalization?: {
    phrase?: string;
    age?: string;
    decoration?: string;
    colors?: string;
    wrappers?: string;
  };
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


function normalizeWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  const withoutLeadingZero = digits.replace(/^0+/, "");

  if (withoutLeadingZero.length === 10 || withoutLeadingZero.length === 11) {
    return "55" + withoutLeadingZero;
  }

  return "";
}

function formatWhatsAppMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents || 0) / 100);
}

function formatWhatsAppDate(value: string) {
  if (!value) return "não informada";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? match[3] + "/" + match[2] + "/" + match[1] : value;
}

async function sendWhatsAppOrderConfirmation(params: {
  name: string;
  phone: string;
  orderCode: string;
  eventDate: string;
  eventTime: string;
  service: string;
  totalCents: number;
  depositCents: number;
  balanceCents: number;
}) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

  if (!token || !phoneNumberId) {
    console.warn("WhatsApp Cloud API não está configurada.");
    return { sent: false, reason: "not_configured" };
  }

  const recipient = normalizeWhatsAppPhone(params.phone);
  if (!recipient) {
    console.warn("WhatsApp inválido para envio.");
    return { sent: false, reason: "invalid_phone" };
  }

  // Mensagem iniciada pela empresa deve usar um modelo aprovado pela Meta.
  // confirmacao_pedido deve estar aprovado em pt_BR com 8 variáveis no corpo.
  const templateParameters = [
    params.name,
    params.orderCode,
    formatWhatsAppDate(params.eventDate),
    params.eventTime || "não informado",
    params.service || "não informado",
    formatWhatsAppMoney(params.totalCents),
    formatWhatsAppMoney(params.depositCents),
    formatWhatsAppMoney(params.balanceCents),
  ].map((value) => ({ type: "text", text: String(value || "não informado") }));

  try {
    const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION?.trim() || "v26.0";
    const response = await fetch(
      "https://graph.facebook.com/" + apiVersion + "/" + phoneNumberId + "/messages",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "template",
          template: {
            name: "confirmacao_pedido",
            language: { code: "pt_BR" },
            components: [
              {
                type: "body",
                parameters: templateParameters,
              },
            ],
          },
        }),
        cache: "no-store",
      },
    );

    const responseText = await response.text();
    let result: { messages?: Array<{ id?: string }>; error?: { message?: string; code?: number; error_subcode?: number } } = {};
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error("Resposta não-JSON da API do WhatsApp.");
    }

    if (!response.ok) {
      console.error("Falha ao enviar confirmação pelo WhatsApp:", {
        status: response.status,
        code: result.error?.code,
        subcode: result.error?.error_subcode,
        message: result.error?.message,
      });
      return { sent: false, reason: "api_error" };
    }

    return {
      sent: true,
      messageId: result.messages?.[0]?.id || null,
    };
  } catch (error) {
    console.error("Erro de conexão com a API do WhatsApp:", error);
    return { sent: false, reason: "network_error" };
  }
}

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
      personalization,
      summary,
    } = body;

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

    // Aceita somente a URL pública de implantação do Apps Script.
    // URLs do editor (/home/projects/.../edit) não são endpoints HTTP.
    const appsScriptPattern = new RegExp(
      "^https://script\\.google\\.com/macros/s/[^/]+(?:/exec|/edit)?/?$",
    );

    if (!appsScriptPattern.test(scriptUrl)) {
      console.error("GOOGLE_APPS_SCRIPT_URL inválida:", scriptUrl);
      return NextResponse.json(
        {
          success: false,
          error:
            "A integração com a planilha está configurada com uma URL inválida. No Apps Script, use a URL da implantação do Aplicativo da Web terminada em /exec.",
        },
        { status: 500 },
      );
    }

    if (scriptUrl.endsWith("/edit")) {
      scriptUrl = scriptUrl.slice(0, -5);
    }
    if (!scriptUrl.endsWith("/exec")) {
      scriptUrl = scriptUrl.replace(/\/$/, "") + "/exec";
    }

    const scriptResponse = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action: "new-order",
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
        personalization: {
          phrase: personalization?.phrase || "",
          age: personalization?.age || "",
          decoration: personalization?.decoration || "",
          colors: personalization?.colors || "",
          wrappers: personalization?.wrappers || "",
        },
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
          balancePaymentMethod: summary?.balancePaymentMethod || "",
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

    const whatsappResult = await sendWhatsAppOrderConfirmation({
      name: name.trim(),
      phone: phone.trim(),
      orderCode: generatedOrderCode,
      eventDate: eventDate || "",
      eventTime: eventTime || "",
      service: service || "",
      totalCents: summary?.totalCents || totalCents || 0,
      depositCents: summary?.depositCents || 0,
      balanceCents: summary?.balanceCents || 0,
    });

    return NextResponse.json({
      success: true,
      orderCode: generatedOrderCode,
      whatsappSent: whatsappResult.sent,
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
