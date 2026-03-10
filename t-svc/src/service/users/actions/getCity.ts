import axios from "axios";
import crypto from "crypto";
import { pool, withTransaction } from "../../db";

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY!;

const BLR_LAT = 12.9716;
const BLR_LNG = 77.5946;
const BLR_RADIUS_KM = 60;

/* ===================================================== */
const normalize = (v?: string | null) => (v ? v.trim().toLowerCase() : null);
const toTitle = (s?: string | null) =>
  (s || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const safeAddressArea = (formatted?: string | null) =>
  formatted ? formatted.split(",").slice(0, 2).join(",").trim() : null;

/* =====================================================
   GOOGLE HELPERS
===================================================== */
async function reverseGeocode(lat: number, lng: number) {
  console.log("📍 Reverse geocoding:", lat, lng);

  const res = await axios.get(
    "https://maps.googleapis.com/maps/api/geocode/json",
    { params: { latlng: `${lat},${lng}`, key: GOOGLE_KEY } }
  );

  if (res.data.status !== "OK" || !res.data.results?.length) return null;

  const r = res.data.results[0];
  const comps = r.address_components || [];
  const get = (t: string) =>
    comps.find((c: any) => c.types.includes(t))?.long_name || null;

  return {
    place_id: r.place_id,
    area: safeAddressArea(r.formatted_address),
    city: get("locality") || get("administrative_area_level_2"),
    state: get("administrative_area_level_1"),
    latitude: lat,
    longitude: lng,
    label: r.formatted_address,
  };
}

async function googleAutocomplete(query: string, token: string) {
  console.log("🌍 Autocomplete:", query);
  const res = await axios.get(
    "https://maps.googleapis.com/maps/api/place/autocomplete/json",
    {
      params: {
        input: query,
        key: GOOGLE_KEY,
        sessiontoken: token,
        components: "country:in",
        types: "geocode",
      },
    }
  );
  return res.data.status === "OK" ? res.data.predictions : [];
}

async function googlePlaceDetails(placeId: string, token: string) {
  const res = await axios.get(
    "https://maps.googleapis.com/maps/api/place/details/json",
    {
      params: {
        place_id: placeId,
        key: GOOGLE_KEY,
        sessiontoken: token,
        fields: "formatted_address,address_components,geometry,place_id",
      },
    }
  );

  if (res.data.status !== "OK") return null;

  const r = res.data.result;
  const comps = r.address_components || [];
  const get = (t: string) =>
    comps.find((c: any) => c.types.includes(t))?.long_name || null;

  return {
    place_id: r.place_id,
    area: safeAddressArea(r.formatted_address),
    city: get("locality") || get("administrative_area_level_2"),
    state: get("administrative_area_level_1"),
    latitude: r.geometry.location.lat,
    longitude: r.geometry.location.lng,
    label: r.formatted_address,
  };
}

/* =====================================================
   UPSERT CITY
===================================================== */
async function upsertCity(data: any) {
  if (!data?.place_id) return null;
  console.log("🔄 Upserting city---", data);
  
    const result = await withTransaction(async (client) => {
  const result = await client.query(
    `INSERT INTO public.city (place_id, city_name, state, area, latitude, longitude)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (place_id)
     DO UPDATE SET
       city_name = EXCLUDED.city_name,
       state = EXCLUDED.state,
       area = EXCLUDED.area,
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude
     RETURNING *`,
    [
      data.place_id,
      normalize(data.city),
      normalize(data.state),
      normalize(data.area),
      data.latitude,
      data.longitude,
    ]
  );
  console.log("💾 UPSERT QUERY RESULT:", result.rows[0]);
  
        return result.rows[0];
    });

  return result
}

const formatRow = (r: any) => ({
  id: r.id,
  name: r.city_name,
  label: `${toTitle(r.area)}, ${toTitle(r.city_name)}`,
  area: toTitle(r.area),
  state: toTitle(r.state),
  latitude: r.latitude,
  longitude: r.longitude,
});

/* =====================================================
   MAIN FUNCTION
===================================================== */
export async function getCity({
  query,
  latitude,
  longitude,
}: {
  query?: string;
  latitude?: number;
  longitude?: number;
}) {
  console.log("➡️ getCity:", { query, latitude, longitude });

  /* ---------- CURRENT LOCATION ---------- */
  if (typeof latitude === "number" && typeof longitude === "number") {
    const place = await reverseGeocode(latitude, longitude);
    if (!place) return [];

    const uniquePlaceId = `${place.place_id}_${latitude.toFixed(5)}_${longitude.toFixed(5)}`;

    const row = await upsertCity({ ...place, place_id: uniquePlaceId });
    if (!row) return [];

    return [{ ...formatRow(row), label: place.label, isCurrentLocation: true }];
  }

  /* ---------- SEARCH ---------- */
  if (!query || query.length < 2) return [];

  const q = `%${query.toLowerCase()}%`;
  const LIMIT = 7;

  const dbRes = await pool.query(
    `
    SELECT *,
      CASE
        WHEN (
          6371 * acos(
            cos(radians($3)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians($4)) +
            sin(radians($3)) * sin(radians(latitude))
          )
        ) <= $5 THEN 1
        WHEN LOWER(state) = 'karnataka' THEN 2
        ELSE 3
      END AS priority
    FROM public.city
    WHERE LOWER(city_name) ILIKE $1 OR LOWER(area) ILIKE $1
    ORDER BY priority ASC, id DESC
    LIMIT $2
    `,
    [q, LIMIT, BLR_LAT, BLR_LNG, BLR_RADIUS_KM]
  );

  let result = dbRes.rows.map(formatRow);

  if (result.length < LIMIT) {
    const token = crypto.randomUUID();
    const preds = await googleAutocomplete(query, token);

    for (const p of preds.slice(0, 10)) {
      const d = await googlePlaceDetails(p.place_id, token);
      if (!d) continue;
      const row = await upsertCity(d);
      if (!row) continue;
      result.push(formatRow(row));
      if (result.length >= LIMIT) break;
    }
  }

  const unique = new Map(result.map((r) => [r.id, r]));
  const final = Array.from(unique.values()).slice(0, LIMIT);

  console.log("📤 Final cities:", final);
  return final;
}
