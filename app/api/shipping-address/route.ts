const RATE = 1;
const ORIGIN = { lat: -20.0109557, lon: -44.0094064 } as const;
const TIMEOUT = 12000;

type C = { lat: number; lon: number };
type Candidate = C & { displayName: string; type?: string; address?: Record<string, string | undefined> };

const fetchT = async (input: string | URL, init: RequestInit = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    return await fetch(input, { ...init, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
};

const norm = (value?: string) => (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const digits = (value?: string) => (value ?? '').replace(/\D/g, '');
const numberFromAddress = (value: string) => value.match(/(?:^|[,;\s])(?:n[ºo]?\.?\s*)?(\d{1,6})(?:\D|$)/i)?.[1] ?? '';

async function search(query: string): Promise<Candidate[]> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('countrycodes', 'br');
    url.searchParams.set('limit', '10');
    url.searchParams.set('q', query);
    const response = await fetchT(url, { headers: { Accept: 'application/json', 'Accept-Language': 'pt-BR', 'User-Agent': 'DoceriaFrete/5.0' } });
    if (!response.ok) return [];
    const data = await response.json() as Array<{ lat?: string; lon?: string; display_name?: string; type?: string; address?: Record<string, string | undefined> }>;
    return data.flatMap(item => {
      const lat = Number(item.lat), lon = Number(item.lon);
      return Number.isFinite(lat) && Number.isFinite(lon) ? [{ lat, lon, displayName: item.display_name ?? query, type: item.type, address: item.address }] : [];
    });
  } catch {
    return [];
  }
}

async function geocode(address: string): Promise<Candidate | null> {
  const cleaned = address.replace(/\bBrasil\b/gi, '').replace(/\s+/g, ' ').trim();
  const withoutCep = cleaned.replace(/\b\d{5}-?\d{3}\b/g, '').replace(/\s+/g, ' ').trim();
  const number = numberFromAddress(withoutCep);
  const queries = [...new Set([
    `${withoutCep}, Belo Horizonte, MG, Brasil`,
    `${withoutCep}, Brasil`,
    `${withoutCep.replace(/,?\s*\d{1,6}\b/, '')}, Belo Horizonte, MG, Brasil`,
  ])];
  const all: Candidate[] = [];
  for (const query of queries) all.push(...await search(query));
  if (!all.length) return null;

  const ranked = all.map(candidate => {
    const a = candidate.address ?? {};
    const house = digits(a.house_number);
    const text = norm(candidate.displayName);
    let score = 0;
    if (number && house === number) score += 150;
    else if (number && house) score -= 120;
    else if (number) score -= 25;
    if (candidate.type === 'house' || candidate.type === 'building' || candidate.type === 'apartments') score += 20;
    if (number && text.includes(` ${number} `)) score += 25;
    if (norm(a.city ?? a.town ?? a.municipality).includes('belo horizonte')) score += 15;
    return { candidate, score };
  }).sort((x, y) => y.score - x.score);

  return ranked[0]?.candidate ?? null;
}

async function route(destination: C): Promise<number | null> {
  const url = new URL(`https://router.project-osrm.org/route/v1/driving/${ORIGIN.lon},${ORIGIN.lat};${destination.lon},${destination.lat}`);
  url.searchParams.set('overview', 'false');
  try {
    const response = await fetchT(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const data = await response.json() as { code?: string; routes?: Array<{ distance?: number }> };
    const distance = data.routes?.[0]?.distance;
    return data.code === 'Ok' && typeof distance === 'number' && Number.isFinite(distance) ? distance : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { address?: string };
    const address = body.address?.trim();
    if (!address || address.length < 8) return Response.json({ error: 'Informe o endereço completo para calcular a entrega.' }, { status: 400 });

    const destination = await geocode(address);
    if (!destination) return Response.json({ error: 'Não foi possível localizar esse endereço. Informe rua, número, bairro e cidade.' }, { status: 422 });

    const meters = await route(destination);
    if (meters === null) return Response.json({ error: 'O endereço foi localizado, mas não foi possível calcular a rota agora. Tente novamente.' }, { status: 503 });

    const oneWayKm = meters / 1000;
    const roundTripKm = oneWayKm * 2;
    return Response.json({ fee: Number(roundTripKm.toFixed(2)) * RATE, oneWayKm: Number(oneWayKm.toFixed(2)), roundTripKm: Number(roundTripKm.toFixed(2)), locatedAddress: destination.displayName }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Não foi possível calcular a entrega neste momento.' }, { status: 500 });
  }
}
