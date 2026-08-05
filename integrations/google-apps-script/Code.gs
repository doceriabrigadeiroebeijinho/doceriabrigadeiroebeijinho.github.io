const SETTINGS = {
  timeZone: "America/Sao_Paulo",
  spreadsheetId: "",
  calendarId: "primary",
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
      ["E-mail", "CPF (opcional)", "Foto de inspiração"],
    );

    const customers = ensureSheet_(
      spreadsheet,
      "Clientes",
      CUSTOMER_HEADERS,
      ["E-mail", "CPF (opcional)"],
    );

    const summary = payload.summary || {};

    const itemsText = (payload.items || [])
      .map((item) => {
        const quantity = item.quantity || 0;
        const name = item.name || "";
        const variant = item.variant || "";

        return `${quantity}x ${name} — ${variant}`;
      })
      .join("\n");

    const methods = String(payload.paymentMethod || "")
      .split(" · restante: ");

    const total = cents_(
      summary.totalCents || payload.totalCents,
    );

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
    ]);

    upsertCustomer_(
      customers,
      payload,
      total,
    );

    createCalendarEvent_(
      payload,
      itemsText,
    );

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

function createCalendarEvent_(payload, itemsText) {
  if (!payload.eventDate || !payload.eventTime) {
    throw new Error(
      "Data e horário da encomenda não foram informados",
    );
  }

  const start = new Date(
    `${payload.eventDate}T${payload.eventTime}:00-03:00`,
  );

  const end = new Date(
    start.getTime() + 30 * 60 * 1000,
  );

  const calendar = CalendarApp.getCalendarById(
    SETTINGS.calendarId,
  );

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
    throw new Error(
      "WhatsApp do cliente não informado",
    );
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

  const previousOrderCount = Number(
    rows[index][5] || 0,
  );

  const previousOrderTotal = Number(
    rows[index][6] || 0,
  );

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

function ensureSheet_(
  spreadsheet,
  name,
  headers,
  obsoleteHeaders,
) {
  const sheet =
    spreadsheet.getSheetByName(name) ||
    spreadsheet.insertSheet(name);

  removeObsoleteColumns_(
    sheet,
    obsoleteHeaders || [],
  );

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
    .getRange(
      1,
      1,
      1,
      sheet.getLastColumn(),
    )
    .getDisplayValues()[0];

  const columnsToDelete = currentHeaders
    .map((header, index) => ({
      header: String(header || "").trim(),
      column: index + 1,
    }))
    .filter((item) =>
      obsoleteHeaders.includes(item.header),
    )
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

  return new Date(
    `${value}T12:00:00-03:00`,
  );
}

function json_(payload) {
  return ContentService
    .createTextOutput(
      JSON.stringify(payload),
    )
    .setMimeType(
      ContentService.MimeType.JSON,
    );
}
