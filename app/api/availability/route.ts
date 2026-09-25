import { getCalendarConfig } from "../../../calendar";

type BusyWindow = {
  start?: string;
  end?: string;
};

const validDate = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!validDate.test(date)) {
    return Response.json(
      { error: "Data inválida.", busy: [], connected: false },
      { status: 400 },
    );
  }

  const calendar = getCalendarConfig();
  if (!calendar.url || !calendar.secret) {
    return Response.json(
      { busy: [], connected: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const endpoint = new URL(calendar.url);
    endpoint.searchParams.set("date", date);
    endpoint.searchParams.set("token", calendar.secret);

    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Agenda indisponível");

    const payload = (await response.json()) as { busy?: BusyWindow[] };
    const busy = (payload.busy ?? []).filter(
      (window): window is { start: string; end: string } => {
        if (
          typeof window.start !== "string" ||
          typeof window.end !== "string"
        ) {
          return false;
        }

        const startMs = new Date(window.start).getTime();
        const endMs = new Date(window.end).getTime();

        if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
          return false;
        }

        // O Google Calendar também pode devolver eventos de dia inteiro
        // como uma janela de 00:00 até 00:00 do dia seguinte. Esses eventos
        // não devem bloquear todos os horários de atendimento: o site só
        // considera compromissos com horário definido.
        const durationHours = (endMs - startMs) / (60 * 60 * 1000);
        return durationHours < 23;
      },
    );

    return Response.json(
      { busy, connected: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        error: "Não foi possível consultar a agenda.",
        busy: [],
        connected: false,
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
