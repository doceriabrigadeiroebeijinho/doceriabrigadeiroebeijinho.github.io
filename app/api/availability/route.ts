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
      (window): window is { start: string; end: string } =>
        typeof window.start === "string" &&
        typeof window.end === "string" &&
        Number.isFinite(new Date(window.start).getTime()) &&
        Number.isFinite(new Date(window.end).getTime()),
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
