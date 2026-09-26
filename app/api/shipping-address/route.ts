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

  const cep = cleaned.match(/\b\d{5}-?\d{3}\b/)?.[0] ?? "";

  const withoutCep = cleaned
    .replace(/\b\d{5}-?\d{3}\b/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*,+/g, ",")
    .trim()
    .replace(/^,|,$/g, "")
    .trim();

  const number = numberFromAddress(withoutCep);

  const parts = withoutCep
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  // A cidade deve vir do endereço informado. Nunca mais forçamos
  // "Belo Horizonte" quando o cliente informou outra cidade, como Contagem.
  let city = "";
  let state = "";
  let cityPartIndex = -1;

  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const part = parts[i];

    if (/^MG$/i.test(part) || /^Minas Gerais$/i.test(part)) {
      state = "Minas Gerais";
      if (i > 0) {
        city = parts[i - 1];
        cityPartIndex = i - 1;
      }
      break;
    }

    const combined = part.match(
      /^(.*?)(?:\\s*-\\s*|\\s+)((?:MG)|(?:Minas Gerais))$/i,
    );

    if (combined) {
      city = combined[1].trim();
      state = /Minas Gerais/i.test(combined[2])
        ? "Minas Gerais"
        : "Minas Gerais";
      cityPartIndex = i;
      break;
    }
  }

  // Aceita "Belo Horizonte - MG" e "Contagem - MG", mas também
  // funciona quando a pessoa informa apenas a cidade sem a UF.
  if (!city) {
    for (let i = parts.length - 1; i >= 1; i -= 1) {
      if (
        /belo horizonte|contagem|betim|ibirite|ribeirao das neves|nova lima|sabará|sabara|santa luzia|vespasiano|caete|brumadinho|juatuba|sarzedo|mario campos|esmeraldas|confins|lagoa santa|raposos|itabirito/i.test(
          parts[i],
        )
      ) {
        city = parts[i];
        cityPartIndex = i;
        break;
      }
    }
  }

  // O negócio está em MG; quando o usuário não informa a UF, assumimos MG,
  // mas preservamos a cidade que ele digitou.
  if (!state) state = "Minas Gerais";

  const streetPart =
    parts[0] && !/^\d{1,6}$/.test(parts[0])
      ? parts[0]
      : parts[1] && !/^\d{1,6}$/.test(parts[1])
        ? parts[1]
        : withoutCep;

  const street = streetPart
    .replace(/(?:,\\s*)?(?:n[ºo]?\\.?\\s*)?\d{1,6}(?=\\s*$)/i, "")
    .trim();

  let neighbourhood = "";
  if (cityPartIndex > 1) {
    const possibleNeighbourhood = parts[cityPartIndex - 1];
    if (
      possibleNeighbourhood &&
      !/^\d{1,6}$/.test(possibleNeighbourhood) &&
      norm(possibleNeighbourhood) !== norm(street)
    ) {
      neighbourhood = possibleNeighbourhood;
    }
  }

  const locationSuffix = [city, state, "Brasil"].filter(Boolean).join(", ");
  const baseWithoutNumber = withoutCep
    .replace(
      /(?:,\\s*)?(?:n[ºo]?\\.?\\s*)?\d{1,6}(?=\\s*(?:,|$))/i,
      "",
    )
    .replace(/\\s+,/g, ",")
    .trim();

  const queries = [
    [withoutCep, locationSuffix].filter(Boolean).join(", "),
    [baseWithoutNumber, locationSuffix].filter(Boolean).join(", "),
    [street, city, state, "Brasil"].filter(Boolean).join(", "),
    cleaned,
  ]
    .map((query) => query.replace(/\\s+/g, " ").trim())
    .filter(Boolean);

  const all: Candidate[] = [];

  if (street || number) {
    all.push(
      ...(await searchNominatimStructured({
        street,
        housenumber: number,
        neighbourhood,
        city,
        state,
        postalcode: cep,
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
    if (distance > MAX_RADIUS_KM) return false;

    const candidateCity = norm(
      candidate.address?.city ??
        candidate.address?.town ??
        candidate.address?.municipality,
    );

    // Quando o cliente informou uma cidade, não aceitamos um candidato
    // localizado em outra cidade. Isso evita, por exemplo, transformar
    // "Contagem" em "Belo Horizonte".
    if (city && candidateCity && candidateCity !== norm(city)) {
      return false;
    }

    return true;
  });

  if (!eligible.length) return null;

  const requestedCity = norm(city);
  const requestedStreet = norm(street);
  const requestedNeighbourhood = norm(neighbourhood);

  const ranked = eligible
    .map((candidate) => {
      const a = candidate.address ?? {};
      const house = digits(a.house_number);
      const text = norm(candidate.displayName);
      const candidateCity = norm(
        a.city ?? a.town ?? a.municipality,
      );
      const candidateStreet = norm(a.road ?? a.street);
      const candidateNeighbourhood = norm(
        a.neighbourhood ?? a.suburb ?? a.district,
      );
      const stateValue = norm(a.state ?? a.state_code);
      const country = norm(a.country ?? a.country_code);

      let score = 0;
      const distance = distanceKm(ORIGIN, candidate);

      if (number && house === number) score += 260;
      else if (number && house) score -= 180;
      else if (number) score -= 35;

      if (requestedStreet && candidateStreet === requestedStreet) score += 90;
      if (
        requestedNeighbourhood &&
        candidateNeighbourhood === requestedNeighbourhood
      ) {
        score += 45;
      }

      if (candidateCity === requestedCity && requestedCity) score += 180;
      if (!requestedCity && candidateCity === "belo horizonte") score += 20;

      if (
        candidate.type === "house" ||
        candidate.type === "building" ||
        candidate.type === "apartments"
      ) {
        score += 25;
      }

      if (number && text.includes(` ${number} `)) score += 35;
      if (stateValue.includes("minas gerais") || stateValue === "mg") score += 10;
      if (country === "brasil" || country === "br") score += 5;

      // Em empate, prefira o candidato mais próximo da doceria.
      score -= distance * 0.5;

      return { candidate, score, distance };
    })
    .sort((x, y) => y.score - x.score);

  return ranked[0]?.candidate ?? null;
}

// Google Routes: distância oficial da rota de carro.
async function routeWithGoogle(
  address: string,
  apiKey: string,
): Promise<number | null> {
  try {
    const response = await fetchT(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.distanceMeters",
        },
        body: JSON.stringify({
          origin: { address: ORIGIN },
          destination: { address },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_UNAWARE",
          computeAlternativeRoutes: false,
          languageCode: "pt-BR",
          units: "METRIC",
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Routes API error", {
        status: response.status,
        body: errorText.slice(0, 1000),
      });
      return null;
    }

    const data = (await response.json()) as {
      routes?: Array<{ distanceMeters?: number }>;
    };

    const meters = data.routes?.[0]?.distanceMeters;

    if (!(typeof meters === "number" && Number.isFinite(meters))) {
      console.error("Google Routes API returned no distance", {
        body: JSON.stringify(data).slice(0, 1000),
      });
      return null;
    }

    return meters;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      address?: string;
      cep?: string;
      street?: string;
      number?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      latitude?: number | null;
      longitude?: number | null;
    };

    const address = body.address?.trim();
    const cep = digits(body.cep);
    const hasCepCoordinates =
      typeof body.latitude === "number" &&
      Number.isFinite(body.latitude) &&
      typeof body.longitude === "number" &&
      Number.isFinite(body.longitude);

    if (
      (!address || address.length < 8) &&
      (!body.street?.trim() || !body.number?.trim() || !body.city?.trim())
    ) {
      return Response.json(
        { error: "Informe o CEP e o número para calcular a entrega." },
        { status: 400 },
      );
    }

    let destination: Candidate | null = null;

    const fallbackAddress = [
      body.street,
      body.number,
      body.neighborhood,
      body.city && body.state
        ? `${body.city} - ${body.state}`
        : body.city || body.state,
      cep ? `CEP ${cep}` : "",
    ]
      .filter(Boolean)
      .join(", ");

    const cepDestination: Candidate | null = hasCepCoordinates
      ? {
          lat: body.latitude as number,
          lon: body.longitude as number,
          displayName: fallbackAddress || address || "Endereço informado",
          type: "postcode",
          address: {
            road: body.street,
            street: body.street,
            house_number: body.number,
            neighbourhood: body.neighborhood,
            city: body.city,
            state: body.state,
            postcode: body.cep,
            country: "Brasil",
            country_code: "br",
          },
        }
      : null;

    if (address) {
      destination = await geocode(address);
    }

    if (!destination && cep && body.city?.trim()) {
      const postalCandidates = await searchNominatimStructured({
        postalcode: cep,
        city: body.city,
        state: body.state || "Minas Gerais",
      });

      const requestedStreet = norm(body.street);
      const requestedCity = norm(body.city);

      destination =
        postalCandidates
          .filter((candidate) => {
            const candidateCity = norm(
              candidate.address?.city ??
                candidate.address?.town ??
                candidate.address?.municipality,
            );
            return !candidateCity || candidateCity === requestedCity;
          })
          .sort((a, b) => {
            const streetA = norm(a.address?.road ?? a.address?.street);
            const streetB = norm(b.address?.road ?? b.address?.street);
            const scoreA =
              (streetA && requestedStreet && streetA === requestedStreet ? 100 : 0) -
              distanceKm(ORIGIN, a);
            const scoreB =
              (streetB && requestedStreet && streetB === requestedStreet ? 100 : 0) -
              distanceKm(ORIGIN, b);
            return scoreB - scoreA;
          })[0] ?? null;
    }

    // A posição aproximada do CEP é a referência estável para o cálculo.
    // Só usamos um geocodificador de endereço quando ele está próximo do CEP.
    if (cepDestination) {
      if (!destination || distanceKm(cepDestination, destination) > 3) {
        destination = cepDestination;
      }
    }

    if (!destination) {
      return Response.json(
        {
          error:
            "Não foi possível localizar o endereço pelo CEP. Confira o CEP e o número informados e tente novamente.",
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

    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
    let meters: number | null = null;

    if (googleApiKey) {
      // Quando a chave do Google estiver configurada, a distância do frete
      // vem diretamente da Google Routes API usando o endereço completo.
      const routeAddress = address || fallbackAddress;
      meters = await routeWithGoogle(routeAddress, googleApiKey);

      if (meters === null) {
        return Response.json(
          {
            error:
              "O Google Maps não conseguiu calcular a rota deste endereço agora. Confira o endereço e tente novamente.",
          },
          { status: 503 },
        );
      }
    } else {
      // Fallback temporário para manter o cálculo funcional até a chave do Google ser carregada no ambiente.
      meters = Math.round(straightLineKm * 1000);
    }

    const oneWayKm = meters / 1000;
    const roundTripKm = oneWayKm * 2;
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
        locationSource: googleApiKey ? "Google Routes" : "CEP",
        distanceMode: googleApiKey ? "rota Google" : "fallback CEP",
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
