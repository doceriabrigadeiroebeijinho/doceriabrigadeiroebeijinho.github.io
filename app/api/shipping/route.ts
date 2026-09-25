const ORIGIN = { lat: -20.0109557, lon: -44.0094064 };
const TIMEOUT = 12000;

type C = { lat: number; lon: number };

type A = {
  address?: string;
  complement?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
};

type R = { lat?: string; lon?: string };

const coords = (a: unknown, b: unknown): C | null => {
  const lat = Number(a);
  const lon = Number(b);
  return Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
    ? { lat, lon }
    : null;
};

const fetchT = async (u: string | URL) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    return await fetch(u, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR",
        "User-Agent": "DoceriaFrete/6.0",
      },
    });
  } finally {
    clearTimeout(timer);
  }
};

async function geocode(query: string): Promise<C | null> {
  if (!query.trim()) return null;
  try {
    const u = new URL("https://nominatim.openstreetmap.org/search");
    u.searchParams.set("format", "jsonv2");
    u.searchParams.set("countrycodes", "br");
    u.searchParams.set("limit", "5");
    u.searchParams.set("q", query);

    const response = await fetchT(u);
    if (!response.ok) return null;

    const results = (await response.json()) as R[];
    for (const result of results) {
      const point = coords(result.lat, result.lon);
      if (point) return point;
    }
  } catch {}
  return null;
}

async function findDestination(a: A): Promise<C | null> {
  const fullAddress = [
    a.address,
    a.complement,
    a.city,
    a.state,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");

  if (a.address?.trim()) {
    const direct = await geocode(fullAddress);
    if (direct) return direct;
  }

  const fallbackAddress = [
    a.street,
    a.number,
    a.neighborhood,
    a.city,
    a.state,
    a.cep,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");

  return geocode(fallbackAddress);
}

async function route(a: C, b: C): Promise<number | null> {
  const u = new URL(
    `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}`,
  );
  u.searchParams.set("overview", "false");
  u.searchParams.set("alternatives", "false");

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchT(u);
      if (response.ok) {
        const data = await response.json();
        const meters = data.routes?.[0]?.distance;
        if (data.code === "Ok" && Number.isFinite(meters)) return meters;
      }
    } catch {}

    if (attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const a = (await req.json()) as A;

    if (!a.address?.trim() && !a.street?.trim()) {
      return Response.json(
        { error: "Informe o endereço completo para calcular a entrega." },
        { status: 400 },
      );
    }

    const destination = await findDestination(a);
    if (!destination) {
      return Response.json(
        {
          error:
            "Não foi possível localizar este endereço. Confira rua, número, bairro, cidade e estado.",
        },
        { status: 422 },
      );
    }

    const meters = await route(ORIGIN, destination);
    if (meters === null) {
      return Response.json(
        { error: "Não foi possível calcular a rota agora. Tente novamente." },
        { status: 503 },
      );
    }

    const oneWayKm = meters / 1000;
    const roundTripKm = oneWayKm * 2;
    const fee = roundTripKm;

    return Response.json(
      {
        fee: Number(fee.toFixed(2)),
        oneWayKm: Number(oneWayKm.toFixed(2)),
        roundTripKm: Number(roundTripKm.toFixed(2)),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Erro ao calcular a entrega. Tente novamente." },
      { status: 500 },
    );
  }
}
