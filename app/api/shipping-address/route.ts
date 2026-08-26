const DELIVERY_RATE_PER_KM = 1;

const ORIGIN = {
  lat: -20.0109557,
  lon: -44.0094064,
} as const;

const REQUEST_TIMEOUT_MS = 10000;

type Coordinates = {
  lat: number;
  lon: number;
};

const fetchWithTimeout = async (
  input: string | URL,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
};

const geocode = async (address: string) => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("q", `${address}, Brasil`);

  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "pt-BR,pt;q=0.9",
      "User-Agent": "Doceria-Brigadeiro-Beijinho/1.2",
    },
  });

  if (!response.ok) return null;

  const results = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
  }>;
  const first = results[0];

  if (!first?.lat || !first?.lon) return null;

  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return {
    coordinates: { lat, lon } satisfies Coordinates,
    displayName: first.display_name ?? address,
  };
};

const getRouteDistance = async (
  origin: Coordinates,
  destination: Coordinates,
): Promise<number | null> => {
  const routeUrl = new URL(
    `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}`,
  );
  routeUrl.searchParams.set("overview", "false");
  routeUrl.searchParams.set("alternatives", "false");
  routeUrl.searchParams.set("steps", "false");

  const response = await fetchWithTimeout(routeUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Doceria-Brigadeiro-Beijinho/1.2",
    },
  });

  if (!response.ok) return null;

  const result = (await response.json()) as {
    code?: string;
    routes?: Array<{ distance?: number }>;
  };

  const meters = result.routes?.[0]?.distance;
  if (result.code !== "Ok" || typeof meters !== "number" || !Number.isFinite(meters)) {
    return null;
  }

  return meters;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { address?: string };
    const address = body.address?.trim();

    if (!address || address.length < 8) {
      return Response.json(
        { error: "Informe o endereço completo para calcular a entrega." },
        { status: 400 },
      );
    }

    const destination = await geocode(address);
    if (!destination) {
      return Response.json(
        { error: "Não foi possível localizar esse endereço. Inclua rua, número, bairro e cidade." },
        { status: 422 },
      );
    }

    const oneWayMeters = await getRouteDistance(ORIGIN, destination.coordinates);
    if (typeof oneWayMeters !== "number") {
      return Response.json(
        { error: "O endereço foi localizado, mas não foi possível calcular a rota agora." },
        { status: 503 },
      );
    }

    const oneWayKm = oneWayMeters / 1000;
    const roundTripKm = oneWayKm * 2;
    const fee = Math.max(0, Math.ceil(roundTripKm * DELIVERY_RATE_PER_KM));

    return Response.json(
      {
        fee,
        oneWayKm: Number(oneWayKm.toFixed(2)),
        roundTripKm: Number(roundTripKm.toFixed(2)),
        locatedAddress: destination.displayName,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Não foi possível calcular a entrega neste momento." },
      { status: 500 },
    );
  }
}
