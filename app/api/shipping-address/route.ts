const RATE_PER_KM = 1;
const ROUNDING_STEP = 2;
const MAX_RADIUS_KM = 50;
const ORIGIN = { lat: -20.0109557, lon: -44.0094064 } as const;
const TIMEOUT = 8000;

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

    let cepData: CepData | null = null;

    if (
      typeof body.latitude === "number" &&
      Number.isFinite(body.latitude) &&
      typeof body.longitude === "number" &&
      Number.isFinite(body.longitude)
    ) {
      cepData = {
        cep,
        street: body.street?.trim() ?? "",
        neighborhood: body.neighborhood?.trim() ?? "",
        city: body.city?.trim() ?? "",
        state: body.state?.trim() ?? "",
        latitude: body.latitude,
        longitude: body.longitude,
      };
    } else {
      cepData = await lookupBrasilApiV2(cep);
    }

    // Se o V2 não retornar coordenadas, tentamos confirmar o CEP no ViaCEP.
    // Não usamos geocodificação livre: isso evita que uma rua com nome
    // semelhante seja localizada em outro bairro/cidade.
    if (!cepData) {
      await lookupViaCep(cep);
      return Response.json(
        {
          error:
            "Não conseguimos obter a localização aproximada deste CEP agora. Confira o CEP e tente novamente.",
        },
        { status: 503 },
      );
    }

    const destination = {
      lat: cepData.latitude,
      lon: cepData.longitude,
    };

    const oneWayKm = distanceKm(ORIGIN, destination);

    if (oneWayKm > MAX_RADIUS_KM) {
      return Response.json(
        {
          error:
            "No momento, atendemos entregas em um raio de até 50 km da doceria.",
        },
        { status: 422 },
      );
    }

    // O frete é baseado na distância do CEP, não em uma rota de carro.
    // Ida + volta = distância em linha reta do CEP × 2.
    const roundTripKm = oneWayKm * 2;
    const calculatedFee = roundTripKm * RATE_PER_KM;
    const fee = Math.ceil(calculatedFee / ROUNDING_STEP) * ROUNDING_STEP;

    const locatedAddress = [
      cepData.street && body.number
        ? `${cepData.street}, ${body.number}`
        : cepData.street,
      cepData.neighborhood,
      cepData.city && cepData.state
        ? `${cepData.city} - ${cepData.state}`
        : cepData.city || cepData.state,
      `CEP ${cepData.cep}`,
    ]
      .filter(Boolean)
      .join(", ");

    return Response.json(
      {
        fee: Number(fee.toFixed(2)),
        oneWayKm: Number(oneWayKm.toFixed(2)),
        roundTripKm: Number(roundTripKm.toFixed(2)),
        straightLineKm: Number(oneWayKm.toFixed(2)),
        locatedAddress,
        maxRadiusKm: MAX_RADIUS_KM,
        roundingStep: ROUNDING_STEP,
        locationSource: "BrasilAPI CEP V2",
        distanceMode: "distância aproximada pelo CEP",
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
