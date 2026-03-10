import axios from "axios";
import { pool } from "../db";
const overpassQuery = require("./overpassQuery");

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const STATE_NAME = "Karnataka";

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ingest() {
  console.log("Fetching Karnataka cities from DB…");

  const cityRes = await pool.query(
    `
    SELECT DISTINCT city_name
    FROM city
    WHERE state = $1
      AND city_name <> 'Bengaluru'
    ORDER BY city_name
    `,
    [STATE_NAME]
  );

  const cities: string[] = cityRes.rows.map((r: { city_name: any; }) => r.city_name);
  console.log(`Found ${cities.length} cities`);

  for (const city of cities) {
    console.log(`\nProcessing city: ${city}`);

    let elements: any[] = [];
    let success = false;

    for (const url of OVERPASS_URLS) {
      try {
        const query = overpassQuery(city);

        const response = await axios.post(
          url,
          `data=${encodeURIComponent(query)}`,
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        elements = response.data.elements || [];
        console.log(`Fetched ${elements.length} records for ${city}`);
        success = true;
        break;
      } catch (err: any) {
        console.error(`Overpass failed for ${city} on ${url}`);
      }
    }

    if (!success) {
      console.log(`Skipping ${city}`);
      await sleep(5000);
      continue;
    }

    let inserted = 0;

    for (const el of elements) {
      if (!el.tags || !el.tags.place) continue;

      if (el.tags.place !== "suburb" && el.tags.place !== "neighbourhood")
        continue;

      const area = el.tags["name:en"] || el.tags.name;
      if (!area || !el.lat || !el.lon) continue;

      try {
        await pool.query(
          `
          INSERT INTO city (city_name, area, state, latitude, longitude)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT DO NOTHING
          `,
          [
            city,
            area.trim(),
            STATE_NAME,
            el.lat,
            el.lon
          ]
        );

        inserted++;
      } catch (err: any) {
        console.error("Insert error:", city, area);
      }
    }

    console.log(`Inserted ${inserted} areas for ${city}`);
    await sleep(4000); // rate limit protection
  }

  console.log("\nIngestion completed");
  process.exit(0);
}

ingest();