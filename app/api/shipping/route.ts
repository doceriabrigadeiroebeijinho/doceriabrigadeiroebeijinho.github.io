const DELIVERY_RATE_PER_KM = 1;
const ORIGIN_ADDRESS =
  "Rua Antônio Eustáquio Pinheiro, 50, Solar do Barreiro, Belo Horizonte, MG, 30628-180, Brasil";

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

const geocode = async (address: string): Promise<Coordinates | null> => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", address);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Doceria-Brigadeiro-Beijinho/1.0",
    },
  });
  if (!response.ok) return null;

  const results = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
  }>;
  const first = results[0];
  if (!first?.lat || !first?.lon) return null;

  const lat = Number(first.lat);
  const lon = Number(first.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
};

const destinationQueries = (address: ShippingAddress) => {
  const exact = [
    address.street,
    address.number,
    address.neighborhood,
    address.city,
    address.state,
    address.cep,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");
  const fallback = [
    address.street,
    address.neighborhood,
    address.city,
    address.state,
    address.cep,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");
  return exact === fallback ? [exact] : [exact, fallback];
};

export async function POST(request: Request) {
  try {
    const address = (await request.json()) as ShippingAddress;
    if (!address.street || !address.number || !address.city || !address.state) {
      return Response.json(
        { error: "Endereço incompleto para calcular a entrega." },
        { status: 400 },
      );
    }

    const origin = await geocode(ORIGIN_ADDRESS);
    let destination: Coordinates | null = null;
    for (const query of destinationQueries(address)) {
      destination = await geocode(query);
      if (destination) break;
    }

    if (!origin || !destination) {
      return Response.json(
        { error: "Não foi possível localizar o endereço informado." },
        { status: 422 },
      );
    }

    const routeUrl = new URL(
      `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}`,
    );
    routeUrl.searchParams.set("overview", "false");
    routeUrl.searchParams.set("alternatives", "false");
    routeUrl.searchParams.set("steps", "false");

    const routeResponse = await fetch(routeUrl, {
      headers: { Accept: "application/json" },
    });
    if (!routeResponse.ok) {
      throw new Error("Falha ao consultar a rota");
    }
    const route = (await routeResponse.json()) as {
      routes?: Array<{ distance?: number }>;
    };
    const oneWayMeters = route.routes?.[0]?.distance;
    if (typeof oneWayMeters !== "number" || !Number.isFinite(oneWayMeters)) {
      throw new Error("Rota não encontrada");
    }

    const fee = Math.max(
      0,
      Math.ceil((oneWayMeters / 1000) * 2 * DELIVERY_RATE_PER_KM),
    );
    return Response.json(
      { fee },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return Response.json(
      { error: "Não foi possível calcular a entrega neste momento." },
      { status: 500 },
    );
  }
}
