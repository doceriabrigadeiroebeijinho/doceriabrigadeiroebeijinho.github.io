const RATE_PER_KM = 1;
const ROUNDING_STEP = 2;
const MAX_RADIUS_KM = 50;
const ORIGIN = { lat: -20.0109557, lon: -44.0094064 } as const;
const TIMEOUT = 12000;

type C = { lat: number; lon: number };
type Candidate = C & {
  displayName: string;
  type?: string;
  address?: Record<string, string | undefined>;
};

const fetchT = async (input: string | URL, init: RequestInit = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

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

const norm = (value?: string) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const digits = (value?: string) => (value ?? "").replace(/\D/g, "");

const numberFromAddress = (value: string) =>
  value.match(/(?:^|[,;\s])(?:n[ºo]?\.?\s*)?(\d{1,6})(?:\D|$)/i)?.[1] ?? "";

const distanceKm = (a: C, b: C) => {
  const earthRadiusKm = 6371;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

async function searchPhoton(query: string): Promise<Candidate[]> {
  try {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "10");
    url.searchParams.set("lat", String(ORIGIN.lat));
    url.searchParams.set("lon", String(ORIGIN.lon));
    url.searchParams.set("zoom", "10");
    url.searchParams.set("lang", "pt");

    const response = await fetchT(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR",
        "User-Agent": "DoceriaFrete/9.0",
      },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      features?: Array<{
        geometry?: { coordinates?: [number, number] };
        properties?: Record<string, string | undefined>;
      }>;
    };

    return (data.features ?? []).flatMap((feature) => {
      const coordinates = feature.geometry?.coordinates;
      if (
        !Array.isArray(coordinates) ||
        coordinates.length < 2 ||
        !Number.isFinite(Number(coordinates[0])) ||
        !Number.isFinite(Number(coordinates[1]))
      ) {
        return [];
      }

      const properties = feature.properties ?? {};
      const address: Record<string, string | undefined> = {
        house_number: properties.housenumber,
        city: properties.city,
        state: properties.state,
        postcode: properties.postcode,
        country: properties.country,
        country_code: properties.countrycode,
        street: properties.street,
        district: properties.district,
      };

      const displayName = [
        properties.street && properties.housenumber
          ? `${properties.street}, ${properties.housenumber}`
          : properties.street,
        properties.district,
        properties.city,
        properties.state,
        properties.postcode,
      ]
        .filter(Boolean)
        .join(", ");

      return [
        {
          lat: Number(coordinates[1]),
          lon: Number(coordinates[0]),
          displayName: displayName || query,
          type: properties.osm_value,
          address,
        },
      ];
    });
  } catch {
    return [];
  }
}

async function searchNominatimStructured(params: {
  street?: string;
  housenumber?: string;
  neighbourhood?: string;
  city?: string;
  state?: string;
  postalcode?: string;
}): Promise<Candidate[]> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("limit", "10");

    for (const [key, value] of Object.entries(params)) {
      if (value?.trim()) url.searchParams.set(key, value.trim());
    }

    const response = await fetchT(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR",
        "User-Agent": "DoceriaFrete/9.0",
      },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
      display_name?: string;
      type?: string;
      address?: Record<string, string | undefined>;
    }>;

    return data.flatMap((item) => {
      const lat = Number(item.lat);
      const lon = Number(item.lon);

      return Number.isFinite(lat) && Number.isFinite(lon)
        ? [
            {
              lat,
              lon,
              displayName: item.display_name ?? "",
              type: item.type,
              address: item.address,
            },
          ]
        : [];
    });
  } catch {
    return [];
  }
}

async function searchNominatim(query: string): Promise<Candidate[]> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("limit", "10");
    url.searchParams.set("q", query);

    const response = await fetchT(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR",
        "User-Agent": "DoceriaFrete/9.0",
      },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
      display_name?: string;
      type?: string;
      address?: Record<string, string | undefined>;
    }>;

    return data.flatMap((item) => {
      const lat = Number(item.lat);
      const lon = Number(item.lon);

      return Number.isFinite(lat) && Number.isFinite(lon)
        ? [
            {
              lat,
              lon,
              displayName: item.display_name ?? query,
              type: item.type,
              address: item.address,
            },
          ]
        : [];
    });
  } catch {
    return [];
  }
}

async function geocode(address: string): Promise<Candidate | null> {
  const cleaned = address
    .replace(/\bBrasil\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const withoutCep = cleaned
    .replace(/\b\d{5}-?\d{3}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const number = numberFromAddress(withoutCep);
  const withoutNumber = withoutCep.replace(
    /(?:,\s*)?(?:n[ºo]?\.?\s*)?\d{1,6}(?=\s*(?:,|$))/i,
    "",
  );

  const parts = withoutCep
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const stateAndCity = parts.find((part) => /belo horizonte|\bmg\b|minas gerais/i.test(part)) ?? "";
  const city = /belo horizonte/i.test(stateAndCity)
    ? "Belo Horizonte"
    : "Belo Horizonte";
  const state = /minas gerais/i.test(stateAndCity) ? "Minas Gerais" : "Minas Gerais";
  const streetPart = parts.find((part) => !/belo horizonte|\bmg\b|minas gerais/i.test(part) && !/^\d{1,6}$/.test(part)) ?? withoutNumber;
  const street = streetPart.replace(
    /(?:,\s*)?(?:n[ºo]?\.?\s*)?\d{1,6}(?=\s*$)/i,
    "",
  ).trim();

  // Primeiro tenta o Photon, usando a posição da doceria como referência.
  // Depois tenta o Nominatim como fallback.
  const queries = [
    `${withoutCep}, Belo Horizonte, Minas Gerais, Brasil`,
    `${withoutCep}, Belo Horizonte, MG, Brasil`,
    `${withoutNumber}, Belo Horizonte, Minas Gerais, Brasil`,
    cleaned,
  ]
    .map((query) => query.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const all: Candidate[] = [];

  if (street || number) {
    all.push(
      ...(await searchNominatimStructured({
        street,
        housenumber: number,
        city,
        state,
        postalcode: cleaned.match(/\b\d{5}-?\d{3}\b/)?.[0],
      })),
    );
  }

  for (const query of [...new Set(queries)]) {
    all.push(...(await searchPhoton(query)));
  }

  for (const query of [...new Set(queries)]) {
    if (all.length >= 30) break;
    all.push(...(await searchNominatim(query)));
  }

  const eligible = all.filter((candidate) => {
    const distance = distanceKm(ORIGIN, candidate);
    return distance <= MAX_RADIUS_KM;
  });

  if (!eligible.length) return null;

  const ranked = eligible
    .map((candidate) => {
      const a = candidate.address ?? {};
      const house = digits(a.house_number);
      const text = norm(candidate.displayName);
      const city = norm(a.city ?? a.town ?? a.municipality);
      const state = norm(a.state ?? a.state_code);
      const country = norm(a.country ?? a.country_code);

      let score = 0;
      const distance = distanceKm(ORIGIN, candidate);

      if (number && house === number) score += 220;
      else if (number && house) score -= 160;
      else if (number) score -= 30;

      if (
        candidate.type === "house" ||
        candidate.type === "building" ||
        candidate.type === "apartments"
      ) {
        score += 25;
      }

      if (number && text.includes(` ${number} `)) score += 35;
      if (city === "belo horizonte") score += 20;
      if (state.includes("minas gerais") || state === "mg") score += 10;
      if (country === "brasil" || country === "br") score += 5;

      // Em empate, prefira o candidato mais próximo da doceria.
      score -= distance * 0.5;

      return { candidate, score, distance };
    })
    .sort((x, y) => y.score - x.score);

  return ranked[0]?.candidate ?? null;
}

async function route(destination: C): Promise<number | null> {
  const url = new URL(
    `https://router.project-osrm.org/route/v1/driving/${ORIGIN.lon},${ORIGIN.lat};${destination.lon},${destination.lat}`,
  );

  url.searchParams.set("overview", "false");
  url.searchParams.set("alternatives", "false");

  try {
    const response = await fetchT(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      code?: string;
      routes?: Array<{ distance?: number }>;
    };

    const distance = data.routes?.[0]?.distance;

    return data.code === "Ok" &&
      typeof distance === "number" &&
      Number.isFinite(distance)
      ? distance
      : null;
  } catch {
    return null;
  }
}

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
        {
          error:
            "Não foi possível confirmar este endereço em Minas Gerais dentro do raio de 50 km da doceria. Confira rua, número, bairro, cidade e estado.",
        },
        { status: 422 },
      );
    }

    const straightLineKm = distanceKm(ORIGIN, destination);

    if (straightLineKm > MAX_RADIUS_KM) {
      return Response.json(
        {
          error:
            "No momento, atendemos entregas em um raio de até 50 km da doceria.",
        },
        { status: 422 },
      );
    }

    const meters = await route(destination);

    if (meters === null) {
      return Response.json(
        {
          error:
            "O endereço foi localizado, mas não foi possível calcular a rota agora. Tente novamente.",
        },
        { status: 503 },
      );
    }

    const oneWayKm = meters / 1000;
    const roundTripKm = oneWayKm * 2;

    // Cobra R$ 1,00 por km no percurso de ida + volta, sempre
    // arredondando para cima até o próximo valor par.
    // Exemplos: R$ 28,20 -> R$ 30,00 e R$ 31,20 -> R$ 32,00.
    const calculatedFee = roundTripKm * RATE_PER_KM;
    const fee = Math.ceil(calculatedFee / ROUNDING_STEP) * ROUNDING_STEP;

    return Response.json(
      {
        fee: Number(fee.toFixed(2)),
        oneWayKm: Number(oneWayKm.toFixed(2)),
        roundTripKm: Number(roundTripKm.toFixed(2)),
        straightLineKm: Number(straightLineKm.toFixed(2)),
        locatedAddress: destination.displayName,
        maxRadiusKm: MAX_RADIUS_KM,
        roundingStep: ROUNDING_STEP,
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
