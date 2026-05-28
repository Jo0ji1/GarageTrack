/**
 * Workshops API — busca oficinas reais via OpenStreetMap Overpass API.
 *
 * Por que Overpass?
 * - Gratuito, sem chave de API.
 * - Cobertura global razoável para `amenity=car_repair`, `shop=motorcycle_repair`.
 * - Funciona em qualquer cidade onde os dados do OSM existam.
 *
 * Trade-offs vs Google Places:
 * - Dados podem estar desatualizados (depende de contribuidores OSM).
 * - Sem reviews/fotos nativas.
 * - Sujeito a rate-limit do servidor público.
 *
 * Boas práticas adotadas:
 * - Timeout via AbortController.
 * - Limite de raio para evitar payload absurdo.
 * - Filtramos resultados sem tags úteis.
 */

export interface NearbyWorkshop {
  osmId: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  website?: string;
  distanceMeters: number;
  source: 'osm';
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RADIUS_METERS = 15_000;
const MIN_RADIUS_METERS = 500;

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

function buildQuery(lat: number, lng: number, radius: number): string {
  // Busca oficinas mecânicas e revendas/serviços relacionados.
  return `[out:json][timeout:20];
(
  node["amenity"="car_repair"](around:${radius},${lat},${lng});
  way["amenity"="car_repair"](around:${radius},${lat},${lng});
  node["shop"="motorcycle_repair"](around:${radius},${lat},${lng});
  way["shop"="motorcycle_repair"](around:${radius},${lat},${lng});
  node["shop"="car_repair"](around:${radius},${lat},${lng});
  node["shop"="tyres"](around:${radius},${lat},${lng});
);
out center tags 60;`;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function pickCoords(el: OverpassElement): { lat: number; lng: number } | null {
  if (typeof el.lat === 'number' && typeof el.lon === 'number') {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  return null;
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const street = tags['addr:street'];
  const number = tags['addr:housenumber'];
  const city = tags['addr:city'] ?? tags['addr:suburb'];
  const state = tags['addr:state'];
  const parts: string[] = [];
  if (street) parts.push(number ? `${street}, ${number}` : street);
  if (city) parts.push(state ? `${city}/${state}` : city);
  return parts.length > 0 ? parts.join(' - ') : undefined;
}

/**
 * Busca oficinas reais em torno de uma coordenada.
 *
 * @throws Error se a rede falhar ou timeout estourar.
 */
export async function searchNearbyWorkshops(
  latitude: number,
  longitude: number,
  radiusMeters = 5_000,
): Promise<NearbyWorkshop[]> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Coordenadas inválidas.');
  }
  const radius = Math.min(MAX_RADIUS_METERS, Math.max(MIN_RADIUS_METERS, radiusMeters));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'User-Agent': 'GarageTrack/1.2 (educational app)',
      },
      body: `data=${encodeURIComponent(buildQuery(latitude, longitude, radius))}`,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass HTTP ${response.status}`);
    }

    const json = (await response.json()) as OverpassResponse;
    const seen = new Set<string>();
    const items: NearbyWorkshop[] = [];

    for (const el of json.elements ?? []) {
      const coords = pickCoords(el);
      if (!coords) continue;
      const tags = el.tags ?? {};
      const name = tags.name ?? tags['name:pt'] ?? tags.operator;
      if (!name) continue;
      const osmId = `${el.type}/${el.id}`;
      if (seen.has(osmId)) continue;
      seen.add(osmId);
      items.push({
        osmId,
        name,
        latitude: coords.lat,
        longitude: coords.lng,
        address: buildAddress(tags),
        phone: tags.phone ?? tags['contact:phone'],
        website: tags.website ?? tags['contact:website'],
        distanceMeters: Math.round(haversineMeters(latitude, longitude, coords.lat, coords.lng)),
        source: 'osm',
      });
    }

    items.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return items.slice(0, 30);
  } finally {
    clearTimeout(timer);
  }
}
