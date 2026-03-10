import axios from "axios";
import { pool } from "../../db";

interface CityLocation {
  id: string;
  latitude: number;
  longitude: number;
}

export const calculateDistanceKm = async (
  origin_id: string,
  dest_id: string
): Promise<number> => {
  if (!origin_id || !dest_id) {
    throw new Error("Origin ID and Destination ID are required");
  }

  // ✅ Fetch both cities in one DB query
  const result = await pool.query<CityLocation>(
    `
    SELECT id, latitude, longitude
    FROM city
    WHERE id IN ($1, $2)
    `,
    [origin_id, dest_id]
  );

  const rows = result.rows;

  if (rows.length !== 2) {
    throw new Error("Invalid city ID(s)");
  }

  const origin = rows.find((r: { id: string; }) => r.id === origin_id);
  const destination = rows.find((r: { id: string; }) => r.id === dest_id);

  if (!origin || !destination) {
    throw new Error("City coordinates not found");
  }

  const distanceResponse = await axios.get(
    "https://maps.googleapis.com/maps/api/distancematrix/json",
    {
      params: {
        origins: `${origin.latitude},${origin.longitude}`,
        destinations: `${destination.latitude},${destination.longitude}`,
        key: process.env.GOOGLE_MAPS_KEY,
        units: "metric",
      },
      timeout: 5000,
    }
  );

  const element = distanceResponse.data?.rows?.[0]?.elements?.[0];

  if (!element || element.status !== "OK") {
    throw new Error("Unable to calculate distance from Google Maps");
  }

  // meters → kilometers
  return element.distance.value / 1000;
};
