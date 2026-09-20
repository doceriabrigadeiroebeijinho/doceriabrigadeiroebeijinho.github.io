const DELIVERY_RATE_PER_KM = 1;

// Origem fixa da doceria: CEP 30628-180.
// O percurso sempre é calculado da origem até o cliente e de volta à origem.
const ORIGIN_COORDINATES = {
  lat: -20.0109557,
  lon: -44.0094064,
} as const;

const REQUEST_TIMEOUT_MS = 12000;

type Coordinates = { lat: number; lon: number };

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
  address?: {
    house_number?: string;
  };
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");

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

const validCoordinates = (lat: unknown, lon: unknown): Coordinates | null => {
  const parsedLat = Number(lat);
  const parsedLon = Number(lon);

  if (
    !Number.isFinite(parsedLat) ||
    !Number.isFinite(parsedLon) ||
    parsedLat < -90 ||
    parsedLat > 90 ||
    parsedLon < -180 ||
    parsedLon > 180
  ) {
    return null;
  }

  return { lat: parsedLat, lon: parsedLon };
};

const geocode = async (query: string): Promise<Coordinates | null> => {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("limit", "5");
    url.searchParams.set("q", query);

    const response = await fetchWithTimeout(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR,pt;q=0.9",
        "User-Agent": "Doceria-Brigadeiro-Beijinho/1.4",
      },
    });

    if (!response.ok) return null;

    const results = (await response.json()) as NominatimResult[];
    const validResults = results
      .map((item) => ({
        coordinates: validCoordinates(item.lat, item.lon),
        hasHouseNumber: Boolean(item.address?.house_number),
      }))
      .filter(
        (item): item is { coordinates: Coordinates; hasHouseNumber: boolean } =>
          item.coordinates !== null,
      );

    const preferred =
      validResults.find((item) => item.hasHouseNumber) ?? validResults[0];

    return preferred?.coordinates ?? null;
  } catch {
    return null;
  }
};

const getCepCoordinates = async (cep: string): Promise<Coordinates | null> => {
  const normalizedCep = onlyDigits(cep);
  if (!/^\d{8}$/.test(normalizedCep)) return null;

  try {
    const response = await fetchWithTimeout(
      `https://brasilapi.com.br/api/cep/v2/${normalizedCep}`,
      {},
      7000,
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      location?: {
        coordinates?: {
          latitude?: number | string;
          longitude?: number | string;
        };
      };
    };

    return validCoordinates(
      data.location?.coordinates?.latitude,
      data.location?.coordinates?.longitude,
    );
  } catch {
    return null;
  }
};

const destinationQueries = (address: ShippingAddress) => {
  const street = address.street?.trim();
  const number = address.number?.trim();
  const neighborhood = address.neighborhood?.trim();
  const cleanNeighborhood = neighborhood?.replace(/\s*\([^)]*\)/g, "").trim();
  const city = address.city?.trim();
  const state = address.state?.trim();
  const cep = onlyDigits(address.cep ?? "");

  const queries = [
    [street, number, neighborhood, city, state, "Brasil"],
    [street, number, cleanNeighborhood, city, state, "Brasil"],
    [street, number, city, state, "Brasil"],
    [street, number, city, "Brasil"],
    [street, number, neighborhood, city, "Brasil"],
    [street, number, cep, "Brasil"],
    [cep, city, state, "Brasil"],
  ];

  return Array.from(
    new Set(
      queries
        .map((parts) => parts.filter(Boolean).join(", "))
        .filter((query) => query.length > 0),
    ),
  );
};

const findDestination = async (address: ShippingAddress) => {
  for (const query of destinationQueries(address)) {
    const destination = await geocode(query);
    if (destination) return destination;
  }

  // Último recurso: algumas consultas de CEP retornam coordenadas do setor postal.
  // É preferível calcular uma taxa aproximada a bloquear todos os CEPs válidos.
  return getCepCoordinates(address.cep ?? "");
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
          "User-Agent": "Doceria-Brigadeiro-Beijinho/1.4",
        },
      });

      if (!response.ok) {
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 700));
          continue;
        }
        return null;
      }

      const route = (await response.json()) as {
        code?: string;
        routes?: Array<{ distance?: number }>;
      };
      const distance = route.routes?.[0]?.distance;

      if (
        route.code === "Ok" &&
        typeof distance === "number" &&
        Number.isFinite(distance)
      ) {
        return distance;
      }

      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        continue;
      }

      return null;
    } catch {
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 700));
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

    const oneWayMeters = await getRouteDistance(ORIGIN_COORDINATES, destination);

    if (typeof oneWayMeters !== "number" || !Number.isFinite(oneWayMeters)) {
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
    const fee = Number((roundTripKm * DELIVERY_RATE_PER_KM).toFixed(2));

    return Response.json(
      {
        fee,
        oneWayKm: Number(oneWayKm.toFixed(2)),
        roundTripKm: Number(roundTripKm.toFixed(2)),
      },
      { headers: { "Cache-Control": "no-store" } },
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
