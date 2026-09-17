const SETTINGS = {
  timeZone: "America/Sao_Paulo",
  spreadsheetId: "",
  calendarId: "primary",
  comandaFolderName: "Comandas - Doceria Brigadeiro & Beijinho",
};

const ORDER_HEADERS = [
  "Criado em",
  "Código",
  "Status",
  "Data da encomenda",
  "Horário",
  "Cliente",
  "WhatsApp",
  "Nascimento",
  "Serviço",
  "Endereço",
  "Itens",
  "Valor dos produtos",
  "Cupom",
  "Desconto Pix",
  "Entrega",
  "Valor total",
  "Entrada / 1ª mensalidade",
  "Restante",
  "Pagamento inicial",
  "Pagamento do restante",
  "Pacote de mesversário",
  "Observações",
  "Comanda PDF",
];

const CUSTOMER_HEADERS = [
  "Cliente",
  "WhatsApp",
  "Nascimento",
  "Primeiro pedido",
  "Último pedido",
  "Quantidade de pedidos",
  "Total em pedidos",
  "Observações",
];

function doGet(event) {
  try {
    validateToken_(event.parameter.token);

    const date = String(event.parameter.date || "");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json_({
        error: "Data inválida",
        busy: [],
      });
    }

    const start = new Date(`${date}T00:00:00-03:00`);
    const end = new Date(`${date}T23:59:59-03:00`);

    const calendar = CalendarApp.getCalendarById(SETTINGS.calendarId);

    if (!calendar) {
      throw new Error("Calendário não encontrado");
    }

    const events = calendar
      .getEvents(start, end)
      .map((item) => ({
        start: item.getStartTime().toISOString(),
        end: item.getEndTime().toISOString(),
      }));

    return json_({
      busy: events,
    });
  } catch (error) {
    return json_({
      error: String(error),
      busy: [],
    });
  }
}

function doPost(event) {
  try {
    const payload = JSON.parse(
      event.postData && event.postData.contents
        ? event.postData.contents
        : "{}",
    );

    validateToken_(payload.token);

    if (payload.action !== "new-order") {
      throw new Error("Ação inválida");
    }

    const spreadsheet = SETTINGS.spreadsheetId
      ? SpreadsheetApp.openById(SETTINGS.spreadsheetId)
      : SpreadsheetApp.getActiveSpreadsheet();

    if (!spreadsheet) {
      throw new Error("Planilha não encontrada");
    }

    const orders = ensureSheet_(
      spreadsheet,
      "Pedidos",
      ORDER_HEADERS,
      [
        "E-mail",
        "CPF (opcional)",
        "Foto de inspiração",
      ],
    );

    const customers = ensureSheet_(
      spreadsheet,
      "Clientes",
      CUSTOMER_HEADERS,
      [
        "E-mail",
        "CPF (opcional)",
      ],
    );

    const summary = payload.summary || {};
    const items = Array.isArray(payload.items) ? payload.items : [];

    const itemsText = items
      .map((item) => {
        const quantity = item.quantity || 0;
        const name = item.name || "";
        const variant = item.variant || "";
        const total = item.totalCents != null
          ? ` — ${formatMoneyFromCents_(item.totalCents)}`
          : "";

        return `${quantity}x ${name}${variant ? ` — ${variant}` : ""}${total}`;
      })
      .join("\n");

    const methods = String(payload.paymentMethod || "").split(" · restante: ");
    const total = cents_(summary.totalCents || payload.totalCents);

    const observations = [
      payload.planPaymentMode
        ? `Pacote: ${payload.planPaymentMode}`
        : "",
      payload.planTermsAccepted
        ? "Condições do pacote aceitas"
        : "",
    ]
      .filter(Boolean)
      .join(" · ");

    orders.appendRow([
      new Date(payload.createdAt || Date.now()),
      payload.orderCode || "",
      "Novo",
      dateValue_(payload.eventDate),
      payload.eventTime || "",
      payload.name || "",
      payload.phone || "",
      dateValue_(payload.birthDate),
      payload.service || "",
      payload.address || "",
      itemsText,
      cents_(summary.productsCents),
      summary.couponCode || "",
      cents_(summary.pixDiscountCents),
      cents_(summary.deliveryCents),
      total,
      cents_(summary.depositCents),
      cents_(summary.balanceCents),
      methods[0] || "",
      summary.balancePaymentMethod || methods[1] || "",
      cents_(summary.planCents),
      observations,
      "",
    ]);

    const orderRow = orders.getLastRow();

    upsertCustomer_(customers, payload, total);
    createCalendarEvent_(payload, itemsText);

    const comandaFile = createComandaPdf_(payload, items, summary);
    const comandaCell = orders.getRange(orderRow, ORDER_HEADERS.length);
    const richText = SpreadsheetApp.newRichTextValue()
      .setText("Abrir comanda")
      .setLinkUrl(comandaFile.getUrl())
      .build();
    comandaCell.setRichTextValue(richText);

    return json_({
      ok: true,
    });
  } catch (error) {
    return json_({
      ok: false,
      error: String(error),
    });
  }
}

function createComandaPdf_(payload, items, summary) {
  const orderCode = payload.orderCode || `BB-${Date.now().toString().slice(-6)}`;
  const clientName = payload.name || "Cliente";
  const doc = DocumentApp.create(`Comanda ${orderCode} - ${clientName}`);
  const body = doc.getBody();

  body
    .setPageWidth(419.53)
    .setPageHeight(595.28)
    .setMarginTop(22)
    .setMarginBottom(22)
    .setMarginLeft(24)
    .setMarginRight(24);

  const title = body
    .appendParagraph("DOCERIA BRIGADEIRO & BEIJINHO")
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setBold(true)
    .setFontSize(14);
  title.setSpacingAfter(2);

  const subtitle = body
    .appendParagraph("COMANDA DE PRODUÇÃO")
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setBold(true)
    .setFontSize(10);
  subtitle.setSpacingAfter(2);

  const orderTitle = body
    .appendParagraph(`PEDIDO ${orderCode}`)
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setBold(true)
    .setFontSize(11);
  orderTitle.setSpacingAfter(8);

  const createdAt = payload.createdAt
    ? Utilities.formatDate(new Date(payload.createdAt), SETTINGS.timeZone, "dd/MM/yyyy HH:mm")
    : Utilities.formatDate(new Date(), SETTINGS.timeZone, "dd/MM/yyyy HH:mm");

  const status = body
    .appendParagraph(`Status: NOVO   •   Recebido em ${createdAt}`)
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setFontSize(8);
  status.setSpacingAfter(8);

  body.appendHorizontalRule();

  appendSectionTitle_(body, "Cliente e entrega");
  appendKeyValueTable_(body, [
    ["Cliente", clientName],
    ["WhatsApp", payload.phone || ""],
    ["Data", formatDateLabel_(payload.eventDate)],
    ["Horário", payload.eventTime || ""],
    ["Serviço", payload.service || ""],
    ["Endereço", payload.address || ""],
  ]);

  appendSectionTitle_(body, "Itens do pedido");

  const itemRows = [["Qtd.", "Item / detalhes", "Valor"]];

  items.forEach((item) => {
    const quantity = Number(item.quantity || 0);
    const name = item.name || "";
    const variant = item.variant || "";
    const detail = [name, variant]
      .filter(Boolean)
      .join("\n");
    const value = item.totalCents != null
      ? formatMoneyFromCents_(item.totalCents)
      : "";

    itemRows.push([
      String(quantity),
      detail,
      value,
    ]);
  });

  if (itemRows.length === 1) {
    itemRows.push(["—", "Nenhum item informado", ""]);
  }

  const itemTable = body.appendTable(itemRows);
  styleTableHeader_(itemTable);
  styleTableBody_(itemTable);

  const personalization = payload.personalization || {};
  const personalizationLines = [
    personalization.phrase
      ? `Frase: ${personalization.phrase}`
      : "",
    personalization.age
      ? `Idade: ${personalization.age}`
      : "",
    personalization.colors
      ? `Cores: ${personalization.colors}`
      : "",
    personalization.decoration
      ? `Observações da decoração: ${personalization.decoration}`
      : "",
    personalization.wrappers
      ? `Forminhas especiais: ${personalization.wrappers}`
      : "",
  ].filter(Boolean);

  if (personalizationLines.length > 0) {
    appendSectionTitle_(body, "Personalização");
    personalizationLines.forEach((line) => {
      const paragraph = body.appendParagraph(`• ${line}`).setFontSize(8.5);
      paragraph.setSpacingAfter(2);
    });
  }

  appendSectionTitle_(body, "Pagamento");

  const methods = String(payload.paymentMethod || "").split(" · restante: ");
  const paymentRows = [
    ["Produtos", formatMoneyFromCents_(summary.productsCents)],
    ["Cupom", summary.couponCode ? `${summary.couponCode} — -${formatMoneyFromCents_(summary.couponDiscountCents)}` : "—"],
    ["Desconto Pix", summary.pixDiscountCents ? `-${formatMoneyFromCents_(summary.pixDiscountCents)}` : "—"],
    ["Entrega", summary.deliveryCents ? formatMoneyFromCents_(summary.deliveryCents) : "—"],
    ["Pacote de mesversário", summary.planCents ? formatMoneyFromCents_(summary.planCents) : "—"],
    ["Valor total", formatMoneyFromCents_(summary.totalCents || payload.totalCents)],
    ["Pagamento inicial", formatMoneyFromCents_(summary.depositCents)],
    ["Restante", formatMoneyFromCents_(summary.balanceCents)],
    ["Pagamento inicial", methods[0] || "—"],
    ["Pagamento do restante", summary.balancePaymentMethod || methods[1] || "—"],
  ];

  if (payload.planPaymentMode) {
    paymentRows.push(["Forma do pacote", payload.planPaymentMode]);
  }

  const paymentTable = body.appendTable(paymentRows);
  styleKeyValueTable_(paymentTable);

  appendSectionTitle_(body, "Conferência / produção");
  const checklist = body
    .appendParagraph("☐ Pagamento confirmado     ☐ Produção     ☐ Pronto     ☐ Entregue")
    .setFontSize(8.5);
  checklist.setSpacingAfter(5);

  const notes = body
    .appendParagraph("Observações da produção:")
    .setBold(true)
    .setFontSize(8.5);
  notes.setSpacingAfter(2);

  body.appendParagraph("____________________________________________________________")
    .setFontSize(8);
  body.appendParagraph("____________________________________________________________")
    .setFontSize(8);

  doc.saveAndClose();

  const docFile = DriveApp.getFileById(doc.getId());
  const folder = getComandaFolder_();
  const pdfName = `Comanda_${safeFilePart_(orderCode)}_${safeFilePart_(clientName)}.pdf`;
  const pdfBlob = docFile.getAs(MimeType.PDF).setName(pdfName);
  const pdfFile = folder.createFile(pdfBlob);

  docFile.setTrashed(true);

  return pdfFile;
}

function appendSectionTitle_(body, text) {
  const paragraph = body
    .appendParagraph(text.toUpperCase())
    .setBold(true)
    .setFontSize(8.5);
  paragraph.setSpacingBefore(7);
  paragraph.setSpacingAfter(3);
  return paragraph;
}

function appendKeyValueTable_(body, rows) {
  const table = body.appendTable(rows);
  styleKeyValueTable_(table);
  return table;
}

function styleKeyValueTable_(table) {
  for (let rowIndex = 0; rowIndex < table.getNumRows(); rowIndex += 1) {
    const row = table.getRow(rowIndex);
    row.getCell(0).editAsText().setBold(true).setFontSize(7.5);
    row.getCell(1).editAsText().setFontSize(7.5);
  }
  return table;
}

function styleTableHeader_(table) {
  const row = table.getRow(0);
  for (let cellIndex = 0; cellIndex < row.getNumCells(); cellIndex += 1) {
    const cell = row.getCell(cellIndex);
    cell.setBackgroundColor("#EDEDED");
    cell.editAsText().setBold(true).setFontSize(7.5);
  }
}

function styleTableBody_(table) {
  for (let rowIndex = 1; rowIndex < table.getNumRows(); rowIndex += 1) {
    const row = table.getRow(rowIndex);
    for (let cellIndex = 0; cellIndex < row.getNumCells(); cellIndex += 1) {
      row.getCell(cellIndex).editAsText().setFontSize(7.5);
    }
  }
}

function getComandaFolder_() {
  const folders = DriveApp.getFoldersByName(SETTINGS.comandaFolderName);
  return folders.hasNext()
    ? folders.next()
    : DriveApp.createFolder(SETTINGS.comandaFolderName);
}

function safeFilePart_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "cliente";
}

function formatDateLabel_(value) {
  if (!value) return "";

  const date = new Date(`${value}T12:00:00-03:00`);
  return Utilities.formatDate(date, SETTINGS.timeZone, "dd/MM/yyyy");
}

function formatMoneyFromCents_(value) {
  return cents_(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function createCalendarEvent_(payload, itemsText) {
  if (!payload.eventDate || !payload.eventTime) {
    throw new Error(
      "Data e horário da encomenda não foram informados",
    );
  }

  const start = new Date(
    `${payload.eventDate}T${payload.eventTime}:00-03:00`,
  );

  const end = new Date(start.getTime() + 30 * 60 * 1000);

  const calendar = CalendarApp.getCalendarById(SETTINGS.calendarId);

  if (!calendar) {
    throw new Error("Calendário não encontrado");
  }

  calendar.createEvent(
    `[PEDIDO] ${payload.orderCode || ""} · ${payload.name || ""}`,
    start,
    end,
    {
      location: payload.address || "",
      description: [
        `WhatsApp: ${payload.phone || ""}`,
        `Serviço: ${payload.service || ""}`,
        "",
        itemsText,
        "",
        "Solicitação recebida pelo site. Confirmar pagamento e disponibilidade.",
      ].join("\n"),
    },
  );
}

function upsertCustomer_(sheet, payload, orderTotal) {
  const rows = sheet.getDataRange().getValues();
  const phone = String(payload.phone || "").trim();

  if (!phone) {
    throw new Error("WhatsApp do cliente não informado");
  }

  const index = rows.findIndex(
    (row, rowIndex) =>
      rowIndex > 0 &&
      String(row[1] || "").trim() === phone,
  );

  const today = new Date();

  if (index === -1) {
    sheet.appendRow([
      payload.name || "",
      phone,
      dateValue_(payload.birthDate),
      today,
      today,
      1,
      orderTotal,
      "",
    ]);
    return;
  }

  const spreadsheetRow = index + 1;
  const previousOrderCount = Number(rows[index][5] || 0);
  const previousOrderTotal = Number(rows[index][6] || 0);

  sheet
    .getRange(
      spreadsheetRow,
      1,
      1,
      CUSTOMER_HEADERS.length,
    )
    .setValues([
      [
        payload.name || rows[index][0],
        phone,
        dateValue_(payload.birthDate) || rows[index][2],
        rows[index][3] || today,
        today,
        previousOrderCount + 1,
        previousOrderTotal + orderTotal,
        rows[index][7] || "",
      ],
    ]);
}

function ensureSheet_(spreadsheet, name, headers, obsoleteHeaders) {
  const sheet =
    spreadsheet.getSheetByName(name) ||
    spreadsheet.insertSheet(name);

  removeObsoleteColumns_(sheet, obsoleteHeaders || []);

  sheet
    .getRange(1, 1, 1, headers.length)
    .setValues([headers]);

  sheet.setFrozenRows(1);

  return sheet;
}

function removeObsoleteColumns_(sheet, obsoleteHeaders) {
  if (
    sheet.getLastRow() === 0 ||
    sheet.getLastColumn() === 0 ||
    obsoleteHeaders.length === 0
  ) {
    return;
  }

  const currentHeaders = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0];

  const columnsToDelete = currentHeaders
    .map((header, index) => ({
      header: String(header || "").trim(),
      column: index + 1,
    }))
    .filter((item) => obsoleteHeaders.includes(item.header))
    .map((item) => item.column)
    .sort((a, b) => b - a);

  columnsToDelete.forEach((column) => {
    sheet.deleteColumn(column);
  });
}

function validateToken_(token) {
  const expected = PropertiesService
    .getScriptProperties()
    .getProperty("SITE_SECRET");

  if (!expected || token !== expected) {
    throw new Error("Não autorizado");
  }
}

function cents_(value) {
  return Number(value || 0) / 100;
}

function dateValue_(value) {
  if (!value) {
    return "";
  }

  return new Date(`${value}T12:00:00-03:00`);
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
