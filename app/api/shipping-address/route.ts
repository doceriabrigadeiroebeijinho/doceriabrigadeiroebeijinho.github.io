const RATE_PER_KM = 1;
const ROUNDING_STEP = 10;
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

const isMinasGerais = (candidate: Candidate) => {
  const a = candidate.address ?? {};
  const state = norm(a.state);
  const stateCode = norm(a.state_code);
  const iso = norm(a["ISO3166-2-lvl4"]);

  // O raio de 50 km em torno da doceria fica integralmente em Minas Gerais.
  // Alguns resultados do mapa não trazem o campo de estado; nesses casos,
  // a própria restrição geográfica já garante que o ponto está dentro da área.
  if (!state && !stateCode && !iso) return true;

  return (
    state.includes("minas gerais") ||
    stateCode === "br mg" ||
    stateCode === "mg" ||
    iso === "br mg" ||
    iso.endsWith(" mg")
  );
};

const buildViewbox = () => {
  const latDelta = MAX_RADIUS_KM / 111.32;
  const lonDelta =
    MAX_RADIUS_KM /
    (111.32 * Math.cos((ORIGIN.lat * Math.PI) / 180));

  const left = ORIGIN.lon - lonDelta;
  const right = ORIGIN.lon + lonDelta;
  const top = ORIGIN.lat + latDelta;
  const bottom = ORIGIN.lat - latDelta;

  return `${left},${top},${right},${bottom}`;
};

async function search(query: string): Promise<Candidate[]> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("limit", "10");
    url.searchParams.set("viewbox", buildViewbox());
    url.searchParams.set("bounded", "1");
    url.searchParams.set("q", query);

    const response = await fetchT(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR",
        "User-Agent": "DoceriaFrete/7.0",
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

  const queries = [
    `${withoutCep}, Minas Gerais, Brasil`,
    `${withoutCep}, MG, Brasil`,
    `${withoutCep}, Brasil`,
    `${withoutNumber}, Minas Gerais, Brasil`,
  ]
    .map((query) => query.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const all: Candidate[] = [];

  for (const query of [...new Set(queries)]) {
    all.push(...(await search(query)));
  }

  const eligible = all.filter((candidate) => {
    const distance = distanceKm(ORIGIN, candidate);
    return isMinasGerais(candidate) && distance <= MAX_RADIUS_KM;
  });

  if (!eligible.length) return null;

  const ranked = eligible
    .map((candidate) => {
      const a = candidate.address ?? {};
      const house = digits(a.house_number);
      const text = norm(candidate.displayName);
      const city = norm(a.city ?? a.town ?? a.municipality);

      let score = 0;
      const distance = distanceKm(ORIGIN, candidate);

      if (number && house === number) score += 180;
      else if (number && house) score -= 140;
      else if (number) score -= 30;

      if (
        candidate.type === "house" ||
        candidate.type === "building" ||
        candidate.type === "apartments"
      ) {
        score += 25;
      }

      if (number && text.includes(` ${number} `)) score += 30;
      if (city === "belo horizonte") score += 10;

      // Entre resultados equivalentes, prefira o mais próximo da doceria.
      score -= distance * 0.4;

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
    // arredondando a taxa para o próximo múltiplo de R$ 10,00.
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
