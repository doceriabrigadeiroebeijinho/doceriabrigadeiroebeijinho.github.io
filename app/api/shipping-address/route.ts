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

type GeocodeResult = {
  coordinates: Coordinates;
  displayName: string;
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

const normalizeAddress = (address: string) =>
  address
    .replace(/\bBrasil\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*,/g, ",")
    .trim()
    .replace(/^,|,$/g, "");

const geocodeQuery = async (query: string): Promise<GeocodeResult | null> => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("q", `${query}, Brasil`);

  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "pt-BR,pt;q=0.9",
      "User-Agent": "Doceria-Brigadeiro-Beijinho/1.3",
    },
  });

  if (!response.ok) return null;

  const results = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
    type?: string;
    importance?: number;
  }>;

  const valid = results
    .map((item) => {
      const lat = Number(item.lat);
      const lon = Number(item.lon);
      if (!item.lat || !item.lon || !Number.isFinite(lat) || !Number.isFinite(lon)) {
        return null;
      }
      return {
        coordinates: { lat, lon },
        displayName: item.display_name ?? query,
        type: item.type ?? "",
        importance: item.importance ?? 0,
      };
    })
    .filter((item): item is GeocodeResult & { type: string; importance: number } => item !== null);

  if (!valid.length) return null;

  const preferred = valid.find((item) =>
    ["house", "building", "residential", "apartments"].includes(item.type),
  );

  return preferred ?? valid[0];
};

const geocode = async (address: string): Promise<GeocodeResult | null> => {
  const normalized = normalizeAddress(address);
  const withoutCep = normalized.replace(/\b\d{5}-?\d{3}\b/g, "").replace(/\s+/g, " ").trim();
  const queries = [
    normalized,
    withoutCep,
    `${withoutCep}, Belo Horizonte, MG`,
  ].filter((query, index, all) => query.length > 0 && all.indexOf(query) === index);

  for (const query of queries) {
    const result = await geocodeQuery(query);
    if (result) return result;
  }

  return null;
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
      "User-Agent": "Doceria-Brigadeiro-Beijinho/1.3",
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
    const fee = Math.max(0, Number((roundTripKm * DELIVERY_RATE_PER_KM).toFixed(2)));

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
