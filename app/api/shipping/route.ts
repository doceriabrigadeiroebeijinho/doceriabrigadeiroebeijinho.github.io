const DELIVERY_RATE_PER_KM = 1;

const ORIGIN_COORDINATES = {
  lat: -20.0109557,
  lon: -44.0094064,
} as const;

const NOMINATIM_MIN_INTERVAL_MS = 1100;
const REQUEST_TIMEOUT_MS = 10000;

type Coordinates = {
  lat: number;
  lon: number;
};

type ShippingAddress = {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
};

type NominatimResult = {
  lat?: string;
  lon?: string;
};

const geocodeCache = new Map<string, Coordinates | null>();

let lastNominatimRequestAt = 0;
let nominatimQueue: Promise<void> = Promise.resolve();

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const waitForNominatimSlot = async () => {
  const previous = nominatimQueue;

  let release!: () => void;
  nominatimQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous.catch(() => undefined);

  const elapsed = Date.now() - lastNominatimRequestAt;
  const wait = Math.max(0, NOMINATIM_MIN_INTERVAL_MS - elapsed);

  if (wait > 0) {
    await sleep(wait);
  }

  lastNominatimRequestAt = Date.now();
  release();
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

const geocode = async (address: string): Promise<Coordinates | null> => {
  const normalized = address.trim();

  if (!normalized) {
    return null;
  }

  if (geocodeCache.has(normalized)) {
    return geocodeCache.get(normalized) ?? null;
  }

  await waitForNominatimSlot();

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", normalized);

    const response = await fetchWithTimeout(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR,pt;q=0.9",
        "User-Agent": "Doceria-Brigadeiro-Beijinho/1.2",
      },
    });

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as NominatimResult[];
    const first = results[0];

    if (!first?.lat || !first?.lon) {
      geocodeCache.set(normalized, null);
      return null;
    }

    const lat = Number(first.lat);
    const lon = Number(first.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      geocodeCache.set(normalized, null);
      return null;
    }

    const coordinates = { lat, lon };

    if (geocodeCache.size >= 100) {
      const firstKey = geocodeCache.keys().next().value as string | undefined;
      if (firstKey) {
        geocodeCache.delete(firstKey);
      }
    }

    geocodeCache.set(normalized, coordinates);
    return coordinates;
  } catch {
    return null;
  }
};

const destinationQueries = (address: ShippingAddress) => {
  // Prioriza o endereço completo, incluindo número. A versão anterior
  // geocodificava primeiro apenas rua + bairro + CEP, o que pode devolver
  // o ponto de referência/centro da rua e distorcer o valor do frete.
  const queries = [
    [
      address.street,
      address.number,
      address.neighborhood,
      address.city,
      address.state,
      address.cep,
      "Brasil",
    ],
    [
      address.street,
      address.number,
      address.city,
      address.state,
      address.cep,
      "Brasil",
    ],
    [
      address.street,
      address.neighborhood,
      address.city,
      address.state,
      address.cep,
      "Brasil",
    ],
    [
      address.street,
      address.city,
      address.state,
      address.cep,
      "Brasil",
    ],
    [
      address.cep,
      address.city,
      address.state,
      "Brasil",
    ],
  ]
    .map((parts) => parts.filter(Boolean).join(", "))
    .filter(Boolean);

  return [...new Set(queries)];
};

const findDestination = async (
  address: ShippingAddress,
): Promise<Coordinates | null> => {
  for (const query of destinationQueries(address)) {
    const coordinates = await geocode(query);

    if (coordinates) {
      return coordinates;
    }
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

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchWithTimeout(routeUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Doceria-Brigadeiro-Beijinho/1.2",
        },
      });

      if (!response.ok) {
        if (attempt === 0) {
          await sleep(700);
          continue;
        }

        return null;
      }

      const route = (await response.json()) as {
        code?: string;
        routes?: Array<{ distance?: number }>;
      };

      const oneWayMeters = route.routes?.[0]?.distance;

      if (
        route.code !== "Ok" ||
        typeof oneWayMeters !== "number" ||
        !Number.isFinite(oneWayMeters)
      ) {
        if (attempt === 0) {
          await sleep(700);
          continue;
        }

        return null;
      }

      return oneWayMeters;
    } catch {
      if (attempt === 0) {
        await sleep(700);
        continue;
      }

      return null;
    }
  }

  return null;
};

export async function POST(request: Request) {
  try {
    const address = (await request.json()) as ShippingAddress;

    if (
      !address.street?.trim() ||
      !address.number?.trim() ||
      !address.city?.trim() ||
      !address.state?.trim()
    ) {
      return Response.json(
        {
          error:
            "Endereço incompleto para calcular a entrega. Confira rua, número, cidade e estado.",
        },
        { status: 400 },
      );
    }

    const origin: Coordinates = ORIGIN_COORDINATES;
    const destination = await findDestination(address);

    if (!destination) {
      return Response.json(
        {
          error:
            "Não foi possível localizar este endereço para calcular a entrega. Confira o número informado.",
        },
        { status: 422 },
      );
    }

    const oneWayMeters = await getRouteDistance(origin, destination);

    if (
      typeof oneWayMeters !== "number" ||
      !Number.isFinite(oneWayMeters)
    ) {
      return Response.json(
        {
          error:
            "O endereço foi localizado, mas não foi possível calcular a rota neste momento. Tente novamente.",
        },
        { status: 503 },
      );
    }

    const oneWayKm = oneWayMeters / 1000;
    const roundTripKm = oneWayKm * 2;

    const fee = Math.max(
      0,
      Math.ceil(roundTripKm * DELIVERY_RATE_PER_KM),
    );

    return Response.json(
      {
        fee,
        oneWayKm: Number(oneWayKm.toFixed(2)),
        roundTripKm: Number(roundTripKm.toFixed(2)),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return Response.json(
      {
        error:
          "Não foi possível calcular a entrega neste momento. Tente novamente em instantes.",
      },
      { status: 500 },
    );
  }
}
