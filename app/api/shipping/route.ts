const RATE = 1;
const ORIGIN = { lat: -20.0109557, lon: -44.0094064 };
const TIMEOUT = 12000;

type C = { lat: number; lon: number };
type A = {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
};
type R = {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: {
    road?: string;
    pedestrian?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
  };
};

const norm = (v?: string) =>
  (v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const dig = (v?: string) => (v ?? "").replace(/\D/g, "");

const fetchT = async (u: string | URL, init: RequestInit = {}) => {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT);
  try {
    return await fetch(u, {
      ...init,
      signal: c.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }
};

const coords = (a: unknown, b: unknown): C | null => {
  const lat = Number(a);
  const lon = Number(b);
  return Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
    ? { lat, lon }
    : null;
};

const stateOK = (a: string, b: string) => {
  if (!b || a === b || a.includes(b) || b.includes(a)) return true;
  const m: Record<string, string> = {
    mg: "minas gerais",
    sp: "sao paulo",
    rj: "rio de janeiro",
    es: "espirito santo",
    pr: "parana",
    sc: "santa catarina",
    rs: "rio grande do sul",
    ba: "bahia",
    go: "goias",
    df: "distrito federal",
  };
  return m[a] === b || m[b] === a;
};

async function nom(params: Record<string, string>): Promise<R[]> {
  try {
    const u = new URL("https://nominatim.openstreetmap.org/search");
    u.searchParams.set("format", "jsonv2");
    u.searchParams.set("addressdetails", "1");
    u.searchParams.set("countrycodes", "br");
    u.searchParams.set("limit", "10");
    for (const [key, value] of Object.entries(params)) {
      if (value) u.searchParams.set(key, value);
    }

    const r = await fetchT(u, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR",
        "User-Agent": "DoceriaFrete/5.0",
      },
    });

    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}

const searchSets = (a: A) => {
  const street = a.street?.trim() ?? "";
  const number = a.number?.trim() ?? "";
  const neighborhood = a.neighborhood?.trim() ?? "";
  const city = a.city?.trim() || "Belo Horizonte";
  const state = a.state?.trim() || "MG";
  const cep = dig(a.cep);

  const sets: Record<string, string>[] = [];

  if (street && number) {
    sets.push({
      street: `${number} ${street}`,
      city,
      state,
      country: "Brazil",
    });
    sets.push({
      street,
      city,
      state,
      country: "Brazil",
      postalcode: cep,
    });
    sets.push({
      q: `${street}, ${number}, ${neighborhood}, ${city}, ${state}, Brasil`,
    });
  }

  if (street) {
    sets.push({
      street,
      city,
      state,
      country: "Brazil",
    });
  }

  if (street && neighborhood) {
    sets.push({
      q: `${street}, ${neighborhood}, ${city}, ${state}, Brasil`,
    });
  }

  if (cep) {
    sets.push({ postalcode: cep, country: "Brazil" });
    sets.push({ q: `${cep}, ${city}, ${state}, Brasil` });
  }

  return sets;
};

async function find(a: A): Promise<C | null> {
  const street = norm(a.street);
  const number = dig(a.number);
  const city = norm(a.city || "Belo Horizonte");
  const state = norm(a.state || "Minas Gerais");
  const neighborhood = norm(a.neighborhood);
  const cep = dig(a.cep);

  const ranked: { c: C; score: number }[] = [];

  for (const params of searchSets(a)) {
    const results = await nom(params);

    for (const r of results) {
      const point = coords(r.lat, r.lon);
      if (!point) continue;

      const z = r.address || {};
      const resultStreet = norm(z.road || z.pedestrian || r.display_name);
      const resultCity = norm(z.city || z.town || z.municipality);
      const resultState = norm(z.state);
      const resultNumber = dig(z.house_number);
      const resultNeighborhood = norm(z.suburb || z.neighbourhood);
      const resultCep = dig(z.postcode);

      if (resultCity && !resultCity.includes(city) && !city.includes(resultCity)) {
        continue;
      }
      if (!stateOK(state, resultState)) continue;

      let score = 10;

      if (street) {
        const tokens = street.split(" ").filter((token) => token.length > 2);
        const matched = tokens.filter((token) => resultStreet.includes(token)).length;

        if (matched === 0) continue;
        score += Math.round((matched / tokens.length) * 45);
      }

      if (number && resultNumber === number) score += 100;
      else if (number && !resultNumber) score -= 10;

      if (neighborhood && resultNeighborhood) {
        if (
          resultNeighborhood.includes(neighborhood) ||
          neighborhood.includes(resultNeighborhood)
        ) {
          score += 20;
        }
      }

      if (cep && resultCep === cep) score += 35;

      // Pure CEP results are valid as a last-resort destination when the
      // street/number cannot be resolved, which is preferable to returning 422.
      // The score keeps an exact address or exact street+CEP result ahead.
      ranked.push({ c: point, score });
    }

    if (ranked.some((item) => item.score >= 145)) break;
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked[0]?.c || null;
}

async function route(a: C, b: C): Promise<number | null> {
  const u = new URL(
    `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}`,
  );
  u.searchParams.set("overview", "false");

  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetchT(u, {
        headers: { Accept: "application/json" },
      });

      if (r.ok) {
        const j = await r.json();
        const d = j.routes?.[0]?.distance;
        if (j.code === "Ok" && Number.isFinite(d)) return d;
      }
    } catch {}

    if (i === 0) {
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const a = (await req.json()) as A;

    if (
      !a.street?.trim() ||
      !a.number?.trim() ||
      !a.city?.trim() ||
      !a.state?.trim()
    ) {
      return Response.json(
        { error: "Endereço incompleto. Informe rua, número, cidade e estado." },
        { status: 400 },
      );
    }

    const destination = await find(a);

    if (!destination) {
      return Response.json(
        {
          error:
            "Não foi possível localizar este endereço. Confira o CEP, rua e número.",
        },
        { status: 422 },
      );
    }

    const meters = await route(ORIGIN, destination);

    if (meters === null) {
      return Response.json(
        { error: "Não foi possível calcular a rota agora. Tente novamente." },
        { status: 503 },
      );
    }

    const oneWayKm = meters / 1000;
    const roundTripKm = oneWayKm * 2;
    const fee = roundTripKm * RATE;

    return Response.json(
      {
        fee: Number(fee.toFixed(2)),
        oneWayKm: Number(oneWayKm.toFixed(2)),
        roundTripKm: Number(roundTripKm.toFixed(2)),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Erro ao calcular a entrega. Tente novamente." },
      { status: 500 },
    );
  }
}
