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
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    municipality?: string;
    state?: string;
  };
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: { housenumber?: string; city?: string; state?: string };
};

const fetchWithTimeout = async (input: string | URL, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
};

const normalize = (value: string | undefined) =>
  (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const stateMatches = (requested: string, returned: string) => {
  if (!requested || !returned) return true;
  if (requested === returned || requested.includes(returned) || returned.includes(requested)) return true;
  const aliases: Record<string, string[]> = {
    mg: ["minas gerais"], sp: ["sao paulo"], rj: ["rio de janeiro"], es: ["espirito santo"],
    pr: ["parana"], sc: ["santa catarina"], rs: ["rio grande do sul"], ba: ["bahia"],
    go: ["goias"], df: ["distrito federal"],
  };
  return (aliases[requested] ?? []).includes(returned) || (aliases[returned] ?? []).includes(requested);
};

const validCoordinates = (lat: unknown, lon: unknown): Coordinates | null => {
  const parsedLat = Number(lat);
  const parsedLon = Number(lon);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) return null;
  return { lat: parsedLat, lon: parsedLon };
};

const geocodeNominatim = async (query: string): Promise<NominatimResult[]> => {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("limit", "10");
    url.searchParams.set("q", query);
    const response = await fetchWithTimeout(url, { headers: { Accept: "application/json", "Accept-Language": "pt-BR,pt;q=0.9", "User-Agent": "Doceria-Brigadeiro-Beijinho/2.0" } });
    if (!response.ok) return [];
    return (await response.json()) as NominatimResult[];
  } catch {
    return [];
  }
};

const geocodePhoton = async (query: string): Promise<NominatimResult[]> => {
  try {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "10");
    url.searchParams.set("lang", "pt");
    const response = await fetchWithTimeout(url, { headers: { Accept: "application/json", "User-Agent": "Doceria-Brigadeiro-Beijinho/2.0" } });
    if (!response.ok) return [];
    const data = (await response.json()) as { features?: PhotonFeature[] };
    return (data.features ?? []).map((feature) => {
      const coordinates = feature.geometry?.coordinates;
      if (!coordinates || coordinates.length < 2) return {};
      const properties = feature.properties ?? {};
      return { lat: String(coordinates[1]), lon: String(coordinates[0]), address: { house_number: properties.housenumber, city: properties.city, state: properties.state } };
    });
  } catch {
    return [];
  }
};

const geocode = async (query: string): Promise<NominatimResult[]> => {
  const [nominatimResults, photonResults] = await Promise.all([geocodeNominatim(query), geocodePhoton(query)]);
  return [...nominatimResults, ...photonResults];
};

const destinationQueries = (address: ShippingAddress) => {
  const street = address.street?.trim();
  const number = address.number?.trim();
  const neighborhood = address.neighborhood?.trim();
  const city = address.city?.trim() || "Belo Horizonte";
  const state = address.state?.trim() || "MG";
  const cep = address.cep?.replace(/\D/g, "");
  return Array.from(new Set([
    [street, number, neighborhood, city, state, "Brasil"],
    [street, number, city, state, "Brasil"],
    [street, number, neighborhood, city, "Brasil"],
    [street, number, cep, city, state, "Brasil"],
    [street, neighborhood, city, state, "Brasil"],
    [street, city, state, "Brasil"],
    [street, neighborhood, city, "Brasil"],
    [street, cep, city, state, "Brasil"],
  ].map((parts) => parts.filter(Boolean).join(", ")).filter(Boolean)));
};

const findDestination = async (address: ShippingAddress): Promise<Coordinates | null> => {
  const requestedNumber = normalize(address.number);
  const requestedCity = normalize(address.city || "Belo Horizonte");
  const requestedState = normalize(address.state || "Minas Gerais");
  let genericFallback: Coordinates | null = null;

  for (const query of destinationQueries(address)) {
    const results = await geocode(query);
    for (const result of results) {
      const coordinates = validCoordinates(result.lat, result.lon);
      if (!coordinates) continue;
      const resultAddress = result.address ?? {};
      const resultNumber = normalize(resultAddress.house_number);
      const resultCity = normalize(resultAddress.city ?? resultAddress.town ?? resultAddress.municipality);
      const resultState = normalize(resultAddress.state);

      if (resultNumber && requestedNumber && resultNumber !== requestedNumber) continue;
      if (resultCity && requestedCity && !resultCity.includes(requestedCity) && !requestedCity.includes(resultCity)) continue;
      if (!stateMatches(requestedState, resultState)) continue;

      if (resultNumber && resultNumber === requestedNumber) return coordinates;
      if (!resultNumber && !genericFallback) genericFallback = coordinates;
    }
  }

  return genericFallback;
};

const getRouteDistance = async (origin: Coordinates, destination: Coordinates): Promise<number | null> => {
  const routeUrl = new URL(`https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}`);
  routeUrl.searchParams.set("overview", "false");
  routeUrl.searchParams.set("alternatives", "false");
  routeUrl.searchParams.set("steps", "false");

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchWithTimeout(routeUrl, { headers: { Accept: "application/json", "User-Agent": "Doceria-Brigadeiro-Beijinho/2.0" } });
      if (!response.ok) {
        if (attempt === 0) { await new Promise((resolve) => setTimeout(resolve, 700)); continue; }
        return null;
      }
      const data = (await response.json()) as { code?: string; routes?: Array<{ distance?: number }> };
      const distance = data.routes?.[0]?.distance;
      if (data.code === "Ok" && typeof distance === "number" && Number.isFinite(distance)) return distance;
    } catch {
      if (attempt === 0) { await new Promise((resolve) => setTimeout(resolve, 700)); continue; }
    }
  }
  return null;
};

export async function POST(request: Request) {
  try {
    const address = (await request.json()) as ShippingAddress;
    if (!address.street?.trim() || !address.number?.trim() || !address.city?.trim() || !address.state?.trim()) {
      return Response.json({ error: "Endereço incompleto para calcular a entrega. Confira rua, número, cidade e estado." }, { status: 400 });
    }

    const destination = await findDestination(address);
    if (!destination) return Response.json({ error: "Não foi possível localizar este endereço. Confira rua, número, bairro e CEP." }, { status: 422 });

    const oneWayMeters = await getRouteDistance(ORIGIN_COORDINATES, destination);
    if (typeof oneWayMeters !== "number") return Response.json({ error: "O endereço foi localizado, mas não foi possível calcular a rota neste momento. Tente novamente." }, { status: 503 });

    const oneWayKm = oneWayMeters / 1000;
    const roundTripKm = oneWayKm * 2;
    const fee = Number((roundTripKm * DELIVERY_RATE_PER_KM).toFixed(2));
    return Response.json({ fee, oneWayKm: Number(oneWayKm.toFixed(2)), roundTripKm: Number(roundTripKm.toFixed(2)) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Não foi possível calcular a entrega neste momento. Tente novamente em instantes." }, { status: 500 });
  }
}
