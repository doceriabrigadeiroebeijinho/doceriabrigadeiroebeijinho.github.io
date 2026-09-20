const DELIVERY_RATE_PER_KM = 1;

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
  display_name?: string;
  address?: {
    house_number?: string;
    city?: string;
    town?: string;
    municipality?: string;
    state?: string;
  };
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

const normalize = (value: string | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const geocode = async (query: string): Promise<NominatimResult[]> => {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("limit", "10");
    url.searchParams.set("q", query);

    const response = await fetchWithTimeout(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR,pt;q=0.9",
        "User-Agent": "Doceria-Brigadeiro-Beijinho/1.5",
      },
    });

    if (!response.ok) return [];
    return (await response.json()) as NominatimResult[];
  } catch {
    return [];
  }
};

const destinationQueries = (address: ShippingAddress) => {
  const street = address.street?.trim();
  const number = address.number?.trim();
  const neighborhood = address.neighborhood?.trim();
  const city = address.city?.trim();
  const state = address.state?.trim();
  const cep = address.cep?.trim();

  const fullAddress = [street, number, neighborhood, city, state, "Brasil"]
    .filter(Boolean)
    .join(", ");
  const streetAndCity = [street, number, city, state, "Brasil"]
    .filter(Boolean)
    .join(", ");
  const fullAddressWithCep = [street, number, neighborhood, city, state, cep, "Brasil"]
    .filter(Boolean)
    .join(", ");

  return Array.from(new Set([fullAddress, fullAddressWithCep, streetAndCity].filter(Boolean)));
};

const findDestination = async (address: ShippingAddress): Promise<Coordinates | null> => {
  const requestedNumber = normalize(address.number);
  const requestedCity = normalize(address.city);
  const requestedState = normalize(address.state);

  for (const query of destinationQueries(address)) {
    const results = await geocode(query);

    const candidates = results
      .map((result) => {
        const coordinates = validCoordinates(result.lat, result.lon);
        const houseNumber = normalize(result.address?.house_number);
        const resultCity = normalize(
          result.address?.city ??
            result.address?.town ??
            result.address?.municipality,
        );
        const resultState = normalize(result.address?.state);

        if (!coordinates) return null;
        if (houseNumber && requestedNumber && houseNumber !== requestedNumber) return null;
        if (resultState && requestedState && !resultState.includes(requestedState)) return null;
        if (resultCity && requestedCity && !resultCity.includes(requestedCity)) return null;

        return {
          coordinates,
          exactNumber: Boolean(houseNumber && houseNumber === requestedNumber),
        };
      })
      .filter(
        (candidate): candidate is { coordinates: Coordinates; exactNumber: boolean } =>
          candidate !== null,
      );

    const preferred = candidates.find((candidate) => candidate.exactNumber);
    if (preferred) return preferred.coordinates;
  }

  // Não utiliza mais coordenadas genéricas do CEP.
  // Sem a localização do imóvel, o sistema não deve gerar uma cobrança possivelmente incorreta.
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
          "User-Agent": "Doceria-Brigadeiro-Beijinho/1.5",
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
            "Não foi possível confirmar a localização exata deste endereço. Confira rua, número, bairro e CEP.",
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
