const RATE_PER_KM = 1;
const ROUNDING_STEP = 2;
const MAX_RADIUS_KM = 50;
const ORIGIN = { lat: -20.0109557, lon: -44.0094064 } as const;
const TIMEOUT = 10000;

type C = { lat: number; lon: number };

type CepData = {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
};

const digits = (value?: string) => (value ?? "").replace(/\D/g, "");

const fetchWithTimeout = async (url: string) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    return await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } finally {
    clearTimeout(timer);
  }
};

async function geocodeAddress(address: string): Promise<C | null> {
  const query = address.trim();
  if (!query) return null;

  // Tentativa 1: Nominatim/OpenStreetMap. Informamos um User-Agent explícito
  // para evitar recusas do serviço e identificamos a aplicação corretamente.
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("addressdetails", "1");

    const response = await fetchWithTimeout(url.toString());
    if (response.ok) {
      const data = (await response.json()) as Array<{
        lat?: string;
        lon?: string;
      }>;

      const latitude = Number(data[0]?.lat);
      const longitude = Number(data[0]?.lon);

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { lat: latitude, lon: longitude };
      }
    }
  } catch {
    // Segue para o segundo provedor.
  }

  // Tentativa 2: Photon/Komoot, como fallback de geocodificação.
  try {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "1");

    const response = await fetchWithTimeout(url.toString());
    if (!response.ok) return null;

    const data = (await response.json()) as {
      features?: Array<{
        geometry?: {
          coordinates?: [number, number];
        };
      }>;
    };

    const coordinates = data.features?.[0]?.geometry?.coordinates;
    const longitude = Number(coordinates?.[0]);
    const latitude = Number(coordinates?.[1]);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return { lat: latitude, lon: longitude };
  } catch {
    return null;
  }
}

async function drivingDistanceKm(a: C, b: C): Promise<number | null> {
  const coordinates = [
    `${a.lon},${a.lat}`,
    `${b.lon},${b.lat}`,
  ].join(";");

  try {
    const response = await fetchWithTimeout(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false&alternatives=false&steps=false`,
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      code?: string;
      routes?: Array<{ distance?: number }>;
    };

    const meters = data.routes?.[0]?.distance;

    if (data.code !== "Ok" || typeof meters !== "number" || !Number.isFinite(meters)) {
      return null;
    }

    return meters / 1000;
  } catch {
    return null;
  }
}

async function lookupBrasilApiV2(cep: string): Promise<CepData | null> {
  try {
    const response = await fetchWithTimeout(
      `https://brasilapi.com.br/api/cep/v2/${cep}`,
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      cep?: string;
      street?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      location?: {
        coordinates?: {
          latitude?: string | number;
          longitude?: string | number;
        };
      };
    };

    const latitude = Number(data.location?.coordinates?.latitude);
    const longitude = Number(data.location?.coordinates?.longitude);

    if (
      !data.street ||
      !data.city ||
      !data.state ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return null;
    }

    return {
      cep: digits(data.cep ?? cep),
      street: data.street,
      neighborhood: data.neighborhood ?? "",
      city: data.city,
      state: data.state,
      latitude,
      longitude,
    };
  } catch {
    return null;
  }
}

async function lookupViaCep(cep: string): Promise<CepData | null> {
  try {
    const response = await fetchWithTimeout(
      `https://viacep.com.br/ws/${cep}/json/`,
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      erro?: boolean;
      cep?: string;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };

    if (
      data.erro ||
      !data.logradouro ||
      !data.localidade ||
      !data.uf
    ) {
      return null;
    }

    // ViaCEP não fornece coordenadas. Ele só entra como fallback para
    // validar o CEP; sem coordenadas não calculamos a distância automaticamente.
    return null;
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

    const cep = digits(body.cep);

    if (!/^\d{8}$/.test(cep)) {
      return Response.json(
        { error: "Informe um CEP válido com 8 números." },
        { status: 400 },
      );
    }

    if (!body.number?.trim()) {
      return Response.json(
        { error: "Informe o número do endereço para continuar." },
        { status: 400 },
      );
    }

    const cepData = await lookupBrasilApiV2(cep);
    const validatedAddress = [
      body.street?.trim() || cepData?.street || "",
      body.number?.trim() || "",
      body.neighborhood?.trim() || cepData?.neighborhood || "",
      body.city?.trim() || cepData?.city || "",
      body.state?.trim() || cepData?.state || "",
      cep,
    ]
      .filter(Boolean)
      .join(", ");

    // Primeiro tentamos localizar o endereço completo, incluindo o número.
    // Isso evita usar o ponto aproximado do CEP quando ele estiver impreciso.
    let destination = await geocodeAddress(validatedAddress);

    // Se não houver resultado para o número exato, tentamos o logradouro +
    // bairro/cidade. Essa busca é apenas um fallback de localização.
    if (!destination) {
      const streetAddress = [
        body.street?.trim() || cepData?.street || "",
        body.neighborhood?.trim() || cepData?.neighborhood || "",
        body.city?.trim() || cepData?.city || "",
        body.state?.trim() || cepData?.state || "",
      ]
        .filter(Boolean)
        .join(", ");

      destination = await geocodeAddress(streetAddress);
    }

    if (!destination) {
      await lookupViaCep(cep);
      return Response.json(
        {
          error:
            "Não conseguimos localizar este endereço para calcular a entrega agora. Confira os dados e tente novamente.",
        },
        { status: 503 },
      );
    }

    const oneWayKm = await drivingDistanceKm(ORIGIN, destination);

    if (oneWayKm === null) {
      return Response.json(
        {
          error:
            "Não foi possível calcular a rota de entrega agora. Tente novamente em alguns instantes.",
        },
        { status: 503 },
      );
    }

    if (oneWayKm > MAX_RADIUS_KM) {
      return Response.json(
        {
          error:
            "No momento, atendemos entregas em um raio de até 50 km da doceria.",
        },
        { status: 422 },
      );
    }

    // A taxa usa a distância real da rota de carro em ida + volta.
    // O valor final é arredondado para cima até o próximo valor par.
    const roundTripKm = oneWayKm * 2;
    const calculatedFee = roundTripKm * RATE_PER_KM;
    const fee = Math.ceil(calculatedFee / ROUNDING_STEP) * ROUNDING_STEP;

    return Response.json(
      {
        fee: Number(fee.toFixed(2)),
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
