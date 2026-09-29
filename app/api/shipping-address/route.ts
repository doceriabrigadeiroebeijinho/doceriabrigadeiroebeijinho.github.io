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
