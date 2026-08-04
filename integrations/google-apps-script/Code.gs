const SETTINGS = {
  timeZone: "America/Sao_Paulo",
  spreadsheetId: "",
  calendarId: "primary",
};

const ORDER_HEADERS = [
  "Criado em", "Código", "Status", "Data da encomenda", "Horário",
  "Cliente", "WhatsApp", "E-mail", "CPF (opcional)", "Nascimento", "Serviço",
  "Endereço", "Itens", "Valor dos produtos", "Cupom", "Desconto Pix",
  "Entrega", "Valor total", "Entrada / 1ª mensalidade", "Restante",
  "Pagamento inicial", "Pagamento do restante", "Pacote de mesversário",
  "Foto de inspiração", "Observações",
];

const CUSTOMER_HEADERS = [
  "Cliente", "WhatsApp", "E-mail", "CPF (opcional)", "Nascimento", "Primeiro pedido",
  "Último pedido", "Quantidade de pedidos", "Total em pedidos", "Observações",
];

function doGet(event) {
  try {
    validateToken_(event.parameter.token);
    const date = String(event.parameter.date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return json_({ error: "Data inválida", busy: [] });
    }

    const start = new Date(`${date}T00:00:00-03:00`);
    const end = new Date(`${date}T23:59:59-03:00`);
    const events = CalendarApp.getCalendarById(SETTINGS.calendarId)
      .getEvents(start, end)
      .map((item) => ({
        start: item.getStartTime().toISOString(),
        end: item.getEndTime().toISOString(),
      }));

    return json_({ busy: events });
  } catch (error) {
    return json_({ error: String(error), busy: [] });
  }
}

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || "{}");
    validateToken_(payload.token);
    if (payload.action !== "new-order") throw new Error("Ação inválida");

    const spreadsheet = SETTINGS.spreadsheetId
      ? SpreadsheetApp.openById(SETTINGS.spreadsheetId)
      : SpreadsheetApp.getActiveSpreadsheet();
    const orders = ensureSheet_(spreadsheet, "Pedidos", ORDER_HEADERS);
    const customers = ensureSheet_(spreadsheet, "Clientes", CUSTOMER_HEADERS);
    const summary = payload.summary || {};
    const itemsText = (payload.items || [])
      .map((item) => `${item.quantity}x ${item.name} — ${item.variant}`)
      .join("\n");
    const methods = String(payload.paymentMethod || "").split(" · restante: ");
    const total = cents_(summary.totalCents || payload.totalCents);

    orders.appendRow([
      new Date(payload.createdAt || Date.now()),
      payload.orderCode || "",
      "Novo",
      dateValue_(payload.eventDate),
      payload.eventTime || "",
      payload.name || "",
      payload.phone || "",
      payload.email || "",
      payload.cpf || "",
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
      payload.inspirationKey || "",
      payload.planPaymentMode ? `Pacote: ${payload.planPaymentMode}` : "",
    ]);

    upsertCustomer_(customers, payload, total);
    createCalendarEvent_(payload, itemsText);
    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}

function createCalendarEvent_(payload, itemsText) {
  const start = new Date(`${payload.eventDate}T${payload.eventTime}:00-03:00`);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const calendar = CalendarApp.getCalendarById(SETTINGS.calendarId);
  calendar.createEvent(
    `[PEDIDO] ${payload.orderCode} · ${payload.name}`,
    start,
    end,
    {
      location: payload.address || "",
      description: [
        `WhatsApp: ${payload.phone}`,
        `Serviço: ${payload.service}`,
        itemsText,
        "Solicitação recebida pelo site. Confirmar pagamento e disponibilidade.",
      ].join("\n"),
    },
  );
}

function upsertCustomer_(sheet, payload, orderTotal) {
  const rows = sheet.getDataRange().getValues();
  const cpf = String(payload.cpf || "");
  const phone = String(payload.phone || "");
  const index = rows.findIndex(
    (row, rowIndex) =>
      rowIndex > 0 &&
      ((cpf && String(row[3]) === cpf) || (phone && String(row[1]) === phone)),
  );
  const today = new Date();

  if (index === -1) {
    sheet.appendRow([
      payload.name || "", phone, payload.email || "", cpf,
      dateValue_(payload.birthDate), today, today, 1, orderTotal, "",
    ]);
    return;
  }

  const row = index + 1;
  sheet.getRange(row, 1, 1, 9).setValues([[
    payload.name || rows[index][0],
    phone || rows[index][1],
    payload.email || rows[index][2],
    cpf || rows[index][3],
    dateValue_(payload.birthDate) || rows[index][4],
    rows[index][5] || today,
    today,
    Number(rows[index][7] || 0) + 1,
    Number(rows[index][8] || 0) + orderTotal,
  ]]);
}

function ensureSheet_(spreadsheet, name, headers) {
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function validateToken_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty("SITE_SECRET");
  if (!expected || token !== expected) throw new Error("Não autorizado");
}

function cents_(value) {
  return Number(value || 0) / 100;
}

function dateValue_(value) {
  if (!value) return "";
  return new Date(`${value}T12:00:00-03:00`);
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
