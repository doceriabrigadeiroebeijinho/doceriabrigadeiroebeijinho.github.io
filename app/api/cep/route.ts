import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type NormalizedAddress = {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  latitude?: number;
  longitude?: number;
  source: "brasilapi-v2" | "viacep" | "brasilapi";
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");

async function fetchWithTimeout(url: string, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function tryBrasilApiV2(cep: string): Promise<NormalizedAddress | null> {
  try {
    const response = await fetchWithTimeout(
      `https://brasilapi.com.br/api/cep/v2/${cep}`,
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      cep?: string;
      state?: string;
      city?: string;
      neighborhood?: string;
      street?: string;
      location?: {
        coordinates?: {
          latitude?: string | number;
          longitude?: string | number;
        };
      };
    };

    const latitude = Number(data.location?.coordinates?.latitude);
    const longitude = Number(data.location?.coordinates?.longitude);

    if (!data.street || !data.city || !data.state) return null;

    return {
      street: data.street,
      neighborhood: data.neighborhood ?? "",
      city: data.city,
      state: data.state,
      cep: onlyDigits(data.cep ?? cep),
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
      source: "brasilapi-v2",
    };
  } catch {
    return null;
  }
}

async function tryViaCep(cep: string): Promise<NormalizedAddress | null> {
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

    if (data.erro) return null;

    return {
      street: data.logradouro ?? "",
      neighborhood: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
      cep: onlyDigits(data.cep ?? cep),
      source: "viacep",
    };
  } catch {
    return null;
  }
}

async function tryBrasilApiV1(cep: string): Promise<NormalizedAddress | null> {
  try {
    const response = await fetchWithTimeout(
      `https://brasilapi.com.br/api/cep/v1/${cep}`,
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      cep?: string;
      state?: string;
      city?: string;
      neighborhood?: string;
      street?: string;
    };

    return {
      street: data.street ?? "",
      neighborhood: data.neighborhood ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
      cep: onlyDigits(data.cep ?? cep),
      source: "brasilapi",
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cep = onlyDigits(searchParams.get("cep") ?? "");

  if (!/^\d{8}$/.test(cep)) {
    return NextResponse.json(
      { error: "Digite um CEP válido com 8 números." },
      { status: 400 },
    );
  }

  // V2: além do endereço, pode fornecer latitude/longitude aproximadas
  // para servir como fallback quando a busca do número exato no mapa falhar.
  const v2 = await tryBrasilApiV2(cep);
  if (v2) {
    return NextResponse.json(v2, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const viaCep = await tryViaCep(cep);
  if (viaCep) {
    return NextResponse.json(viaCep, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const brasilApi = await tryBrasilApiV1(cep);
  if (brasilApi) {
    return NextResponse.json(brasilApi, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json(
    {
      error:
        "Não conseguimos consultar este CEP agora. Confira os números ou tente novamente em instantes.",
    },
    { status: 502 },
  );
}
