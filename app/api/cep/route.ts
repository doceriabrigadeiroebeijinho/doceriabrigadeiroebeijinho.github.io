import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type NormalizedAddress = {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  source: "viacep" | "brasilapi";
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

async function tryBrasilApi(cep: string): Promise<NormalizedAddress | null> {
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

  const viaCep = await tryViaCep(cep);
  if (viaCep) {
    return NextResponse.json(viaCep, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const brasilApi = await tryBrasilApi(cep);
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
