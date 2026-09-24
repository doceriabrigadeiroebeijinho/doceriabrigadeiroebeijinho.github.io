const SETTINGS = {
timeZone: "America/Sao_Paulo",
spreadsheetId: "",
calendarId: "primary",
sharedCalendarName: "Família",
comandaFolderName: "Comandas - Doceria Brigadeiro & Beijinho",
pixKey: "31973416110",
pixHolder: "Déborah Bacelar Braga",
pixBank: "Inter",
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
const calendars = getAvailabilityCalendars_();
const events = calendars
.flatMap((calendar) =>
calendar.getEvents(start, end).map((item) => ({
start: item.getStartTime().toISOString(),
end: item.getEndTime().toISOString(),
})),
)
.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
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
const spreadsheet = SETTINGS.spreadsheetId
? SpreadsheetApp.openById(SETTINGS.spreadsheetId)
: SpreadsheetApp.getActiveSpreadsheet();
if (!spreadsheet) {
throw new Error("Planilha não encontrada para gerar a comanda");
}
const tempName = `__COMANDA_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
const sheet = spreadsheet.insertSheet(tempName);
const C = {
black: "#111111",
gray: "#555555",
line: "#BDBDBD",
white: "#FFFFFF",
};
const money_ = (value) => formatMoneyFromCents_(value);
const text_ = (value) => String(value ?? "").trim();
const compact_ = (value, max) => {
const v = text_(value).replace(/\s+/g, " ");
if (!max || v.length <= max) return v;
return `${v.slice(0, max - 1).trim()}…`;
};
const setRange_ = (range, value, opts = {}) => {
range
.setValue(value)
.setBackground(C.white)
.setFontFamily("Arial")
.setFontSize(opts.size || 8)
.setFontColor(opts.color || C.black)
.setFontWeight(opts.bold ? "bold" : "normal")
.setHorizontalAlignment(opts.h || "left")
.setVerticalAlignment("middle")
.setWrap(true);
range.setBorder(
true,
true,
true,
true,
false,
false,
C.line,
SpreadsheetApp.BorderStyle.SOLID,
);
};
const merge_ = (a1, value, opts = {}) => {
const range = sheet.getRange(a1).merge();
setRange_(range, value, opts);
return range;
};
const widths = [42, 64, 64, 64, 64, 64, 64, 62];
widths.forEach((width, i) => sheet.setColumnWidth(i + 1, width));
for (let r = 1; r <= 34; r++) sheet.setRowHeight(r, 17);
sheet.setRowHeight(1, 28);
sheet.setRowHeight(2, 7);
sheet.setRowHeight(3, 17);
merge_("A1:F1", "CONTROLE DE PEDIDOS", {
color: C.black,
bold: true,
size: 11.5,
h: "left",
});
merge_("G1:H1", `PEDIDO ${orderCode}`, {
color: C.black,
bold: true,
size: 8,
h: "center",
});
const headerSpacer = sheet.getRange("A2:H2");
headerSpacer.merge();
headerSpacer
.setValue("")
.setBackground(C.white)
.setBorder(false, false, true, false, false, false);
sheet.setRowHeight(2, 7);
merge_("A3:H3", "CLIENTE", {
color: C.black,
bold: true,
size: 8,
h: "left",
});
merge_("A4:B4", "Nome", { color: C.gray, bold: true, size: 7 });
merge_("C4:F4", compact_(clientName, 52), { size: 7.5, bold: true });
merge_("G4:G4", "WhatsApp", { color: C.gray, bold: true, size: 6.6 });
merge_("H4:H4", formatPhoneBr_(payload.phone || ""), { size: 6.8, bold: true, h: "center" });
const serviceLabel = /entrega/i.test(String(payload.service || "")) ? "Entrega" : "Retirada";
const dateLabel = formatDateLabel_(payload.eventDate);
const dateLine = `Serviço: ${serviceLabel}   |   Data: ${dateLabel}`;
merge_("A5:H5", dateLine, { color: C.black, bold: true, size: 6.9, h: "left" });
const locationLine = `Horário: ${payload.eventTime || "—"}   |   Local: ${compact_(payload.address || "", 125)}`;
merge_("A6:H6", locationLine, { color: C.black, bold: true, size: 6.5, h: "left" });
sheet.setRowHeight(5, 18);
sheet.setRowHeight(6, 22);
merge_("A7:H7", "ITENS DO PEDIDO", {
color: C.black,
bold: true,
size: 8,
h: "left",
});
merge_("A8:A8", "Qtd.", { color: C.gray, bold: true, size: 7, h: "center" });
merge_("B8:G8", "Produto / detalhes", { color: C.gray, bold: true, size: 7, h: "center" });
merge_("H8:H8", "Valor", { color: C.gray, bold: true, size: 7, h: "center" });
const shown = Array.isArray(items) && items.length ? items.slice(0, 4) : [];
let row = 9;
if (!shown.length) {
merge_("A10:A10", "—", { size: 7, h: "center" });
merge_("B10:G10", "Nenhum item informado", { size: 7 });
merge_("H10:H10", "", { size: 7, h: "right" });
row = 11;
} else {
shown.forEach((item) => {
const detailParts = [];
const main = [text_(item.name), text_(item.variant)].filter(Boolean).join(" — ");
if (main) detailParts.push(main);
if (item.type) detailParts.push(`Tipo: ${item.type}`);
const detail = compact_(detailParts.join(" · "), 185);
merge_(`A${row}:A${row}`, String(item.quantity || 0), {
size: 7.2,
bold: true,
h: "center",
});
merge_(`B${row}:G${row}`, detail, { size: 6.7, h: "left" });
merge_(`H${row}:H${row}`, item.totalCents != null ? money_(item.totalCents) : "", {
size: 6.7,
bold: true,
h: "right",
});
sheet.setRowHeight(row, 25);
row += 1;
});
if (items.length > shown.length) {
merge_(`A${row}:H${row}`, `+ ${items.length - shown.length} outro(s) item(ns) não exibido(s)`, {
color: C.gray,
size: 6.2,
bold: true,
h: "center",
});
row += 1;
}
}
merge_(`A${row}:H${row}`, "PAGAMENTO", {
color: C.black,
bold: true,
size: 8,
h: "left",
});
row += 1;
const paymentRows = [];
paymentRows.push([
"Produtos",
money_(summary.productsCents),
"",
"",
]);
if (summary.deliveryCents) {
paymentRows.push(["Entrega", money_(summary.deliveryCents), "", ""]);
}
paymentRows.push(["Entrada (60%)", money_(summary.depositCents), "Restante (40%)", money_(summary.balanceCents)]);
const methods = String(payload.paymentMethod || "").split(" · restante: ");
paymentRows.push([
"Pagamento inicial",
compact_(methods[0] || "—", 26),
"Pagamento restante",
compact_(summary.balancePaymentMethod || methods[1] || "—", 26),
]);
paymentRows.forEach((vals) => {
merge_(`A${row}:B${row}`, vals[0], { color: C.gray, bold: true, size: 6.6 });
merge_(`C${row}:D${row}`, vals[1], { size: 6.6, h: "right" });
merge_(`E${row}:F${row}`, vals[2], { color: C.gray, bold: true, size: 6.6 });
merge_(`G${row}:H${row}`, vals[3], { size: 6.6, h: "right" });
row += 1;
});
merge_(`A${row}:F${row}`, "VALOR TOTAL", { color: C.black, bold: true, size: 8.5 });
merge_(`G${row}:H${row}`, money_(summary.totalCents || payload.totalCents), {
color: C.black,
bold: true,
size: 9,
h: "right",
});
sheet.setRowHeight(row, 21);
row += 1;
const p = payload.personalization || {};
const personalization = [
p.phrase ? `Frase: ${p.phrase}` : "",
p.age ? `Idade: ${p.age}` : "",
p.colors ? `Cores: ${p.colors}` : "",
p.decoration ? `Decoração: ${p.decoration}` : "",
p.wrappers ? `Forminhas: ${p.wrappers}` : "",
].filter(Boolean);
if (personalization.length) {
merge_(`A${row}:H${row}`, "PERSONALIZAÇÃO", {
color: C.black,
bold: true,
size: 8,
h: "left",
});
row += 1;
merge_(`A${row}:H${row + 1}`, compact_(personalization.join("  |  "), 220), {
size: 6.5,
h: "left",
});
sheet.setRowHeight(row, 18);
sheet.setRowHeight(row + 1, 18);
row += 2;
}
sheet.setHiddenGridlines(true);
sheet.setFrozenRows(0);
sheet.getRange(`A1:H${Math.max(row, 1)}`)
.setVerticalAlignment("middle")
.setFontFamily("Arial")
.setWrap(true)
.setBackground(C.white)
.setFontColor(C.black);
SpreadsheetApp.flush();
Utilities.sleep(700);
const folder = getComandaFolder_();
const pdfName = `Comanda_${safeFilePart_(orderCode)}_${safeFilePart_(clientName)}.pdf`;
const exportUrl = [
`https://docs.google.com/spreadsheets/d/${spreadsheet.getId()}/export?format=pdf`,
`gid=${sheet.getSheetId()}`,
`size=A5`,
`portrait=true`,
`fitw=true`,
`scale=4`,
`sheetnames=false`,
`printtitle=false`,
`pagenumbers=false`,
`gridlines=false`,
`fzr=false`,
`horizontal_alignment=CENTER`,
`vertical_alignment=MIDDLE`,
`top_margin=0.15`,
`bottom_margin=0.15`,
`left_margin=0.15`,
`right_margin=0.15`,
`attachment=false`,
].join("&");
try {
const response = UrlFetchApp.fetch(exportUrl, {
headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
muteHttpExceptions: true,
});
const code = response.getResponseCode();
if (code !== 200) {
throw new Error(`Falha ao exportar a comanda em PDF. HTTP ${code}`);
}
return folder.createFile(response.getBlob().setName(pdfName));
} finally {
spreadsheet.deleteSheet(sheet);
}
}
const COMANDA_LOGO_URL =
"https://raw.githubusercontent.com/doceriabrigadeiroebeijinho/doceriabrigadeiroebeijinho.github.io/main/public/assets/logo-complete.webp";
function formatPhoneBr_(value) {
const digits = String(value || "").replace(/\D/g, "");
if (digits.length === 11) {
return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
if (digits.length === 10) {
return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
}
return value || "";
}
function truncateComandaText_(value, maxChars) {
const text = String(value || "").replace(/\s+/g, " ").trim();
if (text.length <= maxChars) {
return text;
}
return `${text.slice(0, Math.max(1, maxChars - 1)).trim()}…`;
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
const calendar = getOrderCalendar_();
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
function getSharedCalendar_() {
const name = String(SETTINGS.sharedCalendarName || "").trim();
if (!name) {
return null;
}
const calendars = CalendarApp.getCalendarsByName(name);
return calendars.length ? calendars[0] : null;
}

function getOrderCalendar_() {
const shared = getSharedCalendar_();
if (shared) {
return shared;
}
const primary = CalendarApp.getCalendarById(SETTINGS.calendarId);
if (!primary) {
throw new Error("Calendário principal não encontrado");
}
return primary;
}

function getAvailabilityCalendars_() {
const calendars = [];
const primary = CalendarApp.getCalendarById(SETTINGS.calendarId);
if (primary) {
calendars.push(primary);
}
const shared = getSharedCalendar_();
if (shared && !calendars.some((calendar) => calendar.getId() === shared.getId())) {
calendars.push(shared);
}
if (!calendars.length) {
throw new Error("Nenhum calendário disponível");
}
return calendars;
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
function formatDateLabel_(value) {
if (!value) return "";
const date = new Date(`${value}T12:00:00-03:00`);
const weekdays = [
"domingo",
"segunda-feira",
"terça-feira",
"quarta-feira",
"quinta-feira",
"sexta-feira",
"sábado",
];
const weekday = weekdays[date.getUTCDay()];
const datePart = Utilities.formatDate(date, SETTINGS.timeZone, "dd/MM/yyyy");
return `${weekday}, ${datePart}`;
}
function formatMoneyFromCents_(value) {
const cents = Number(value || 0);
return (cents / 100).toLocaleString(
"pt-BR",
{
style: "currency",
currency: "BRL",
},
);
}
function getComandaFolder_() {
const folders = DriveApp.getFoldersByName(
SETTINGS.comandaFolderName,
);
return folders.hasNext()
? folders.next()
: DriveApp.createFolder(
SETTINGS.comandaFolderName,
);
}
function safeFilePart_(value) {
return String(value || "")
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.replace(/[^a-zA-Z0-9]+/g, "-")
.replace(/^-+|-+$/g, "")
.slice(0, 60) || "cliente";
}
function autorizarComandas() {
DriveApp.getRootFolder().getName();
const doc = DocumentApp.create(
"AUTORIZAÇÃO - COMANDA TEMPORÁRIA",
);
doc.getBody().appendParagraph(
"Documento temporário para autorizar a geração das comandas.",
);
doc.saveAndClose();
DriveApp.getFileById(doc.getId()).setTrashed(true);
SpreadsheetApp.getActiveSpreadsheet().toast(
"Autorizações das comandas concluídas.",
"Doceria",
5,
);
}
function testarComanda() {
const payload = {
orderCode: "TESTE-001",
name: "Cliente Teste",
phone: "31999999999",
eventDate: "2026-10-05",
eventTime: "16:30",
service: "Retirada",
address: "Rua Antônio Eustáquio Pinheiro, 50, Solar do Barreiro, Belo Horizonte - MG, 30628-180",
paymentMethod: "Pix · restante: Pix",
createdAt: new Date().toISOString(),
personalization: {
phrase: "Parabéns!",
age: "5 anos",
decoration: "Topo de bolo",
colors: "Rosa e branco",
wrappers: "",
},
};
const items = [
{
quantity: 1,
name: "Bolo Clássico",
variant: "Mini (12 cm) — Massa branca — Chantilly — Brigadeiro com Ninho — Topo de bolo",
totalCents: 11000,
},
];
const summary = {
productsCents: 11000,
couponCode: "",
couponDiscountCents: 0,
pixDiscountCents: 330,
deliveryCents: 0,
totalCents: 10670,
depositCents: 6402,
balanceCents: 4268,
planCents: 0,
balancePaymentMethod: "Pix",
};
const arquivo = createComandaPdf_(
payload,
items,
summary,
);
Logger.log(
`PDF criado: ${arquivo.getUrl()}`,
);
}
