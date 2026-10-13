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


function onlyDigits(value?: string): string {
  return String(value || "").replace(/\D/g, "");
}

function normalizeWhatsappNumber(value?: string): string {
  let digits = onlyDigits(value);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length >= 12 && !digits.startsWith("55")) {
    digits = digits.slice(1);
  }
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function formatDateForMessage(value?: string): string {
  if (!value) return "A combinar";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function formatMoneyFromCents(value?: number): string {
  return (Number(value || 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

async function createClickUpOrderTask(
  body: OrderRequestBody,
  orderCode: string,
): Promise<void> {
  const token = process.env.CLICKUP_API_TOKEN?.trim();
  const listId = process.env.CLICKUP_LIST_ID?.trim();

  // Keep the order checkout working even before ClickUp credentials are added.
  if (!token || !listId) {
    console.info("ClickUp sync skipped: CLICKUP_API_TOKEN/CLICKUP_LIST_ID not configured.");
    return;
  }

  const clientName = body.name?.trim() || "Cliente";
  const clientPhone = body.phone?.trim() || "";
  const dateLabel = formatDateForMessage(body.eventDate);
  const timeLabel = body.eventTime || "A combinar";
  const service = body.service || "A combinar";
  const address = body.address || (service.toLowerCase().includes("retirada") ? "Retirada na doceria" : "Não informado");
  const items = body.items || [];
  const itemsText = items.length
    ? items.map((item) => {
        const quantity = Number(item.quantity || 1);
        const itemName = item.name || item.type || "Item";
        const variant = item.variant ? ` — ${item.variant}` : "";
        return `- ${quantity} × ${itemName}${variant} — ${formatMoneyFromCents(item.totalCents)}`;
      }).join("\n")
    : "- Itens não informados";
  const summary = body.summary || {};
  const totalCents = Number(summary.totalCents ?? body.totalCents ?? 0);
  const depositCents = Number(summary.depositCents ?? Math.round(totalCents * 0.6));
  const balanceCents = Number(summary.balanceCents ?? Math.max(0, totalCents - depositCents));
  const personalization = body.personalization || {};
  const personalizationLines = [
    personalization.phrase ? `- Frase: ${personalization.phrase}` : "",
    personalization.age ? `- Idade: ${personalization.age}` : "",
    personalization.decoration ? `- Decoração: ${personalization.decoration}` : "",
    personalization.colors ? `- Cores: ${personalization.colors}` : "",
    personalization.wrappers ? `- Embalagens: ${personalization.wrappers}` : "",
  ].filter(Boolean).join("\n") || "Não informado";

  const clientMessage =
    `Oi, ${clientName}! Tudo bem? Confirmamos o recebimento da entrada de 60% da sua encomenda ${orderCode}. Seu pedido está confirmado para ${dateLabel} às ${timeLabel}. Obrigada pela preferência!`;
  const deliveryMessage = [
    "ENTREGA — DOCERIA BRIGADEIRO & BEIJINHO",
    `Cliente: ${clientName}`,
    `Contato da cliente: ${clientPhone}`,
    `Endereço: ${address}`,
    `Dia da entrega: ${dateLabel}`,
    `Horário da entrega: ${timeLabel}`,
    `Taxa de entrega: ${formatMoneyFromCents(summary.deliveryCents)}`,
    `Total a receber na entrega: ${formatMoneyFromCents(balanceCents)}`,
  ].join("\n");

  const customerNumber = normalizeWhatsappNumber(clientPhone);
  const customerWhatsappUrl = customerNumber.length >= 12
    ? `https://wa.me/${customerNumber}?text=${encodeURIComponent(clientMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(clientMessage)}`;
  const driverNumberRaw = process.env.CLICKUP_DRIVER_WHATSAPP;
  const driverNumber = driverNumberRaw ? normalizeWhatsappNumber(driverNumberRaw) : "";
  const deliveryWhatsappUrl = driverNumber.length >= 12
    ? `https://wa.me/${driverNumber}?text=${encodeURIComponent(deliveryMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(deliveryMessage)}`;

  const markdownContent = [
    `# Encomenda ${orderCode}`,
    "",
    "**Status inicial:** orçamento recebido — conferir a disponibilidade da data e o pagamento da entrada de 60%.",
    "",
    `**Cliente:** ${clientName}`,
    `**WhatsApp:** ${clientPhone}`,
    `**Data solicitada:** ${dateLabel} às ${timeLabel}`,
    `**Atendimento:** ${service}`,
    `**Endereço:** ${address}`,
    "",
    "## Itens",
    itemsText,
    "",
    "## Valores",
    `- Total estimado: ${formatMoneyFromCents(totalCents)}`,
    `- Entrada prevista (60%): ${formatMoneyFromCents(depositCents)}`,
    `- Saldo previsto (40%): ${formatMoneyFromCents(balanceCents)}`,
    `- Forma de pagamento informada: ${body.paymentMethod || "Não informada"}`,
    "",
    "## Personalização",
    personalizationLines,
    "",
    "## Mensagem para a cliente",
    "Use somente depois de conferir que a entrada de 60% foi recebida.",
    `[Abrir WhatsApp da cliente com a confirmação pronta](${customerWhatsappUrl})`,
    "",
    "## Mensagem para o entregador",
    "Revise o endereço e o horário antes de enviar. O link abre o WhatsApp com o resumo preenchido; se o número do entregador não estiver configurado, selecione a conversa manualmente.",
    `[Abrir WhatsApp com o resumo da entrega](${deliveryWhatsappUrl})`,
  ].join("\n");

  const dueDate = body.eventDate
    ? new Date(`${body.eventDate}T${body.eventTime || "12:00"}:00-03:00`).getTime()
    : NaN;
  const taskPayload: Record<string, unknown> = {
    name: `${orderCode} — ${clientName} — ${dateLabel}`,
    description: markdownContent,
    status: "pendente",
  };
  if (Number.isFinite(dueDate)) {
    taskPayload.due_date = dueDate;
    taskPayload.due_date_time = Boolean(body.eventTime);
  }

  try {
    const response = await fetch(`https://api.clickup.com/api/v2/list/${encodeURIComponent(listId)}/task`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(taskPayload),
      cache: "no-store",
    });
    const responseText = await response.text();
    let result: { id?: string; url?: string; err?: string; error?: string } = {};
    try {
      result = JSON.parse(responseText);
    } catch {
      // Keep unexpected HTML/text out of customer-facing checkout errors.
    }
    if (!response.ok) {
      console.error("ClickUp task creation failed:", response.status, result.err || result.error || "API error");
      return;
    }
    console.info("ClickUp task created for order:", orderCode, result.id || "");
  } catch (error) {
    // The order is already saved in Google; a ClickUp outage must not fail checkout.
    console.error("ClickUp sync failed for order:", orderCode, error);
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

    await createClickUpOrderTask(body, generatedOrderCode);

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
