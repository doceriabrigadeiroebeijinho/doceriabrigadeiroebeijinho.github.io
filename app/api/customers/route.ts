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


function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapComandaText(value: string, maxChars = 48): string[] {
  const words = String(value || "Não informado").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (!line) line = word;
    else if ((line + " " + word).length <= maxChars) line += " " + word;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : ["Não informado"];
}

function buildComandaSvg(body: OrderRequestBody, orderCode: string, logoDataUri = ""): string {
  const clientName = body.name?.trim() || "Cliente";
  const clientPhone = body.phone?.trim() || "Não informado";
  const dateLabel = formatDateForMessage(body.eventDate);
  const timeLabel = body.eventTime || "A combinar";
  const service = body.service || "A combinar";
  const isPickup = service.toLowerCase().includes("retirada");
  const address = body.address || (isPickup ? "Retirada na doceria" : "Não informado");
  const summary = body.summary || {};
  const totalCents = Number(summary.totalCents ?? body.totalCents ?? 0);
  const depositCents = Number(summary.depositCents ?? Math.round(totalCents * 0.6));
  const balanceCents = Number(summary.balanceCents ?? Math.max(0, totalCents - depositCents));
  const items = body.items || [];
  const personalization = body.personalization || {};
  const parts: string[] = [];
  let y = 214;

  const addText = (
    value: string,
    opts: { x?: number; size?: number; color?: string; weight?: number | string; maxChars?: number; lineHeight?: number } = {},
  ) => {
    const x = opts.x ?? 48;
    const size = opts.size ?? 20;
    const color = opts.color ?? "#4b2e25";
    const weight = opts.weight ?? 400;
    const lines = wrapComandaText(value, opts.maxChars ?? Math.floor(610 / (size * 0.56)));
    for (const line of lines) {
      parts.push('<text x="' + x + '" y="' + y + '" font-family="Arial, Helvetica, sans-serif" font-size="' + size + '" font-weight="' + weight + '" fill="' + color + '">' + escapeXml(line) + '</text>');
      y += opts.lineHeight ?? Math.round(size * 1.55);
    }
  };
  const addSection = (heading: string) => {
    y += 15;
    parts.push('<rect x="36" y="' + (y - 24) + '" width="648" height="38" rx="9" fill="#f5dcda"/>');
    addText(heading.toUpperCase(), { x: 52, size: 16, color: "#9c4f59", weight: 700, maxChars: 55, lineHeight: 26 });
    y += 12;
  };
  const addRule = () => {
    y += 3;
    parts.push('<line x1="48" y1="' + y + '" x2="672" y2="' + y + '" stroke="#ead7c9" stroke-width="1.5"/>');
    y += 20;
  };

  addText("CLIENTE", { size: 14, color: "#9c4f59", weight: 700, maxChars: 60, lineHeight: 22 });
  addText(clientName, { size: 25, weight: 700, maxChars: 40, lineHeight: 34 });
  addText("WhatsApp: " + clientPhone, { size: 17, color: "#806b63", maxChars: 58, lineHeight: 25 });
  addText("Data: " + dateLabel + "   |   Horário: " + timeLabel, { size: 18, weight: 600, maxChars: 53, lineHeight: 28 });
  addText("Modalidade: " + service, { size: 17, maxChars: 55, lineHeight: 26 });
  addText((isPickup ? "Retirada: " : "Endereço: ") + address, { size: 17, maxChars: 55, lineHeight: 26 });
  addRule();

  addSection("Itens da encomenda");
  if (items.length) {
    for (const item of items) {
      const quantity = Number(item.quantity || 1);
      const itemName = item.name || item.type || "Item";
      const variant = item.variant ? " — " + item.variant : "";
      addText(quantity + " × " + itemName + variant, { size: 19, weight: 600, maxChars: 50, lineHeight: 29 });
      addText(formatMoneyFromCents(item.totalCents), { x: 58, size: 17, color: "#6f493d", maxChars: 58, lineHeight: 25 });
      y += 5;
    }
  } else {
    addText("Itens não informados", { size: 18, maxChars: 55 });
  }
  addRule();

  const personalLines = [
    personalization.phrase ? "Frase: " + personalization.phrase : "",
    personalization.age ? "Idade: " + personalization.age : "",
    personalization.decoration ? "Decoração: " + personalization.decoration : "",
    personalization.colors ? "Cores: " + personalization.colors : "",
    personalization.wrappers ? "Embalagens: " + personalization.wrappers : "",
  ].filter(Boolean);
  if (personalLines.length) {
    addSection("Personalização");
    for (const line of personalLines) addText(line, { size: 17, maxChars: 55, lineHeight: 26 });
    addRule();
  }

  addSection("Resumo financeiro");
  addText("VALOR TOTAL", { size: 15, color: "#806b63", weight: 700, maxChars: 55, lineHeight: 25 });
  y += 18;
  addText(formatMoneyFromCents(totalCents), { size: 34, color: "#9c4f59", weight: 700, maxChars: 30, lineHeight: 48 });
  y += 3;
  addText("Entrada prevista (60%): " + formatMoneyFromCents(depositCents), { size: 18, weight: 600, maxChars: 48, lineHeight: 29 });
  addText("Saldo previsto (40%): " + formatMoneyFromCents(balanceCents), { size: 18, maxChars: 48, lineHeight: 29 });
  addText("Pagamento informado: " + (body.paymentMethod || "Não informado"), { size: 17, color: "#6f493d", maxChars: 52, lineHeight: 27 });
  y += 22;

  const height = y + 100;
  const logo = logoDataUri
    ? '<image x="39" y="27" width="123" height="126" preserveAspectRatio="xMidYMid meet" href="' + logoDataUri + '"/>'
    : '<text x="100" y="96" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="700" fill="#9c4f59">B&amp;B</text>';

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="' + height + '" viewBox="0 0 720 ' + height + '">',
    '<rect width="720" height="' + height + '" fill="#fff8ee"/>',
    '<rect x="0" y="0" width="720" height="190" fill="#9c4f59"/>',
    '<circle cx="660" cy="30" r="95" fill="#f5dcda" opacity=".12"/>',
    '<circle cx="30" cy="180" r="80" fill="#fffdf8" opacity=".08"/>',
    '<rect x="27" y="21" width="147" height="140" rx="16" fill="#fffdf8"/>',
    logo,
    '<text x="194" y="52" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" letter-spacing="1.8" fill="#f5dcda">DOCERIA ARTESANAL</text>',
    '<text x="194" y="86" font-family="Georgia, serif" font-size="26" font-weight="700" fill="#fffdf8">Brigadeiro &amp; Beijinho</text>',
    '<text x="194" y="116" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="600" letter-spacing="1.1" fill="#fffdf8">COMANDA DE ENCOMENDA</text>',
    '<rect x="194" y="135" width="258" height="31" rx="15" fill="#fffdf8"/>',
    '<text x="323" y="156" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#9c4f59">' + escapeXml(orderCode) + '</text>',
    ...parts,
    '<line x1="48" y1="' + (height - 63) + '" x2="672" y2="' + (height - 63) + '" stroke="#ead7c9" stroke-width="1.5"/>',
    '<text x="360" y="' + (height - 34) + '" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#806b63">Comanda gerada automaticamente • Confira os detalhes antes de produzir</text>',
    '</svg>',
  ].join("");
}

async function attachClickUpComanda(
  token: string,
  taskId: string,
  body: OrderRequestBody,
  orderCode: string,
): Promise<void> {
  try {
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;
    let logoDataUri = "";
    try {
      const logoResponse = await fetch("https://doceriabrigadeiroebeijinho.com.br/assets/logo-complete.webp", {
        cache: "force-cache",
        signal: AbortSignal.timeout(5000),
      });
      if (logoResponse.ok) {
        const logoSource = Buffer.from(await logoResponse.arrayBuffer());
        const logoPng = await sharp(logoSource).png().toBuffer();
        logoDataUri = "data:image/png;base64," + logoPng.toString("base64");
      } else {
        console.warn("Comanda logo unavailable:", logoResponse.status);
      }
    } catch (logoError) {
      console.warn("Comanda logo could not be loaded; using branded fallback:", logoError);
    }

    const svg = buildComandaSvg(body, orderCode, logoDataUri);
    const pngBuffer = await sharp(Buffer.from(svg)).png({ compressionLevel: 8 }).toBuffer();
    const form = new FormData();
    const file = new Blob([new Uint8Array(pngBuffer)], { type: "image/png" });
    const safeOrderCode = orderCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    form.append("attachment", file, safeOrderCode + "-comanda.png");
    const response = await fetch("https://api.clickup.com/api/v2/task/" + encodeURIComponent(taskId) + "/attachment", {
      method: "POST",
      headers: { Authorization: token, Accept: "application/json" },
      body: form,
      cache: "no-store",
    });
    if (!response.ok) {
      const details = (await response.text()).slice(0, 500);
      console.error("ClickUp comanda attachment failed:", response.status, details);
      return;
    }
    console.info("ClickUp PNG comanda attached for order:", orderCode);
  } catch (error) {
    // Attachment is supplementary; never fail an order that was already saved.
    console.error("ClickUp PNG comanda attachment failed for order:", orderCode, error);
  }
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

  const isPickup = service.toLowerCase().includes("retirada");
  const atendimentoLabel = isPickup ? "Retirada" : service;
  const paymentLocationLabel = isPickup ? "na retirada" : "na entrega";
  const itemsSummary = items.length
    ? items.map((item) => {
        const quantity = Number(item.quantity || 1);
        const itemName = item.name || item.type || "Item";
        const variant = item.variant ? " — " + item.variant : "";
        return "- " + quantity + " × " + itemName + variant + " — " + formatMoneyFromCents(item.totalCents);
      }).join("\n")
    : "- Itens não informados";
  const deliveryFeeCents = Number(summary.deliveryCents || 0);
  const clientOrderReceivedMessage = [
    "Olá, " + clientName + "! Tudo bem? Recebemos sua solicitação de encomenda " + orderCode + " na Doceria Brigadeiro & Beijinho.",
    "",
    "Confira os detalhes do pedido:",
    itemsSummary,
    "",
    "Data: " + dateLabel,
    "Horário: " + timeLabel,
    "Modalidade: " + atendimentoLabel,
    (isPickup ? "Endereço para retirada: " : "Endereço para entrega: ") + address,
    "",
    "Valor total: " + formatMoneyFromCents(totalCents),
    "Entrada de 60% para confirmar: " + formatMoneyFromCents(depositCents),
    "Restante de 40%: " + formatMoneyFromCents(balanceCents),
    "",
    "Para confirmar sua encomenda, você prefere realizar o pagamento da entrada via Pix ou cartão de crédito? O pedido e a data serão confirmados após a confirmação do pagamento da entrada. 😊",
  ].join("\n");

  const clientOrderConfirmedMessage = [
    "Olá, " + clientName + "! Obrigada por enviar o comprovante.",
    "Confirmamos o recebimento da entrada de " + formatMoneyFromCents(depositCents) + " e sua encomenda " + orderCode + " está confirmada!",
    "",
    "Data: " + dateLabel,
    "Horário: " + timeLabel,
    "Modalidade: " + atendimentoLabel,
    (isPickup ? "Endereço para retirada: " : "Endereço para entrega: ") + address,
    "",
    "Valor total: " + formatMoneyFromCents(totalCents),
    "Entrada recebida: " + formatMoneyFromCents(depositCents),
    "Restante (" + paymentLocationLabel + "): " + formatMoneyFromCents(balanceCents),
    "",
    "Agradecemos pela preferência. Qualquer atualização, entraremos em contato por aqui!",
  ].join("\n");

  const clientOutForDeliveryMessage = [
    "Olá, " + clientName + "! Sua encomenda " + orderCode + " já saiu para entrega.",
    "",
    "Endereço: " + address,
    "Data: " + dateLabel,
    "Horário combinado: " + timeLabel,
    "",
    "Por favor, fique atenta ao telefone para receber o pedido. Obrigada!",
  ].join("\n");

  const clientPickupReadyMessage = [
    "Olá, " + clientName + "! Sua encomenda " + orderCode + " está pronta e disponível para retirada.",
    "",
    "Endereço para retirada: " + address,
    "Data: " + dateLabel,
    "Horário combinado: " + timeLabel,
    "",
    "Obrigada pela preferência!",
  ].join("\n");

  const deliveryMessage = [
    "ENTREGA — DOCERIA BRIGADEIRO & BEIJINHO",
    "Cliente: " + clientName,
    "Contato da cliente: " + clientPhone,
    "Endereço: " + address,
    "Dia da entrega: " + dateLabel,
    "Horário da entrega: " + timeLabel,
    "Taxa de entrega: " + formatMoneyFromCents(deliveryFeeCents),
    "Total a receber na entrega: " + formatMoneyFromCents(balanceCents),
  ].join("\n");

  const customerNumber = normalizeWhatsappNumber(clientPhone);
  const makeCustomerWhatsappUrl = (message: string) => customerNumber.length >= 12
    ? "https://wa.me/" + customerNumber + "?text=" + encodeURIComponent(message)
    : "https://wa.me/?text=" + encodeURIComponent(message);
  const customerOrderReceivedUrl = makeCustomerWhatsappUrl(clientOrderReceivedMessage);
  const customerOrderConfirmedUrl = makeCustomerWhatsappUrl(clientOrderConfirmedMessage);
  const customerOutForDeliveryUrl = makeCustomerWhatsappUrl(clientOutForDeliveryMessage);
  const customerPickupReadyUrl = makeCustomerWhatsappUrl(clientPickupReadyMessage);

  const driverNumberRaw = process.env.CLICKUP_DRIVER_WHATSAPP;
  const driverNumber = driverNumberRaw ? normalizeWhatsappNumber(driverNumberRaw) : "";
  const deliveryWhatsappUrl = driverNumber.length >= 12
    ? "https://wa.me/" + driverNumber + "?text=" + encodeURIComponent(deliveryMessage)
    : "https://wa.me/?text=" + encodeURIComponent(deliveryMessage);

  const whatsappMessageLinks = [
    "## Mensagem 1 — Pedido recebido",
    "Enviar após receber a solicitação. O pedido ainda não está confirmado.",
    "[Abrir WhatsApp — pedido recebido e opções de pagamento](" + customerOrderReceivedUrl + ")",
    "",
    "## Mensagem 2 — Entrada recebida e pedido confirmado",
    "Enviar somente depois de conferir que a entrada de 60% foi recebida.",
    "[Abrir WhatsApp — confirmação do pedido](" + customerOrderConfirmedUrl + ")",
    "",
    ...(isPickup
      ? [
          "## Mensagem 3 — Encomenda pronta para retirada",
          "Enviar quando o pedido estiver pronto.",
          "[Abrir WhatsApp — pronta para retirada](" + customerPickupReadyUrl + ")",
        ]
      : [
          "## Mensagem 3 — Pedido saiu para entrega",
          "Enviar quando o pedido realmente sair para entrega.",
          "[Abrir WhatsApp — saiu para entrega](" + customerOutForDeliveryUrl + ")",
          "",
          "## Mensagem 4 — Resumo para o entregador",
          "Atalho para o WhatsApp do entregador com cliente, telefone, endereço, data, horário, taxa de entrega e valor a receber.",
          "[Abrir WhatsApp do entregador — resumo da entrega](" + deliveryWhatsappUrl + ")",
        ]),
  ].join("\n");

  const markdownContent = [
    `# Encomenda ${orderCode}`,
    "",
    "## AÇÕES RÁPIDAS",
    whatsappMessageLinks,
    "",
    "---",
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
    if (result.id) {
      await attachClickUpComanda(token, result.id, body, orderCode);
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
