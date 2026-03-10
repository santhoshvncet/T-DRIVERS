import { Pool } from "pg";
import env from "../config/env"; 

export const pool = new Pool({
  user: env.DB_USER,
  host: env.DB_HOST,
  database: env.DB_NAME,
  password: env.DB_PASSWORD,
  port: env.DB_PORT,

  ssl: { rejectUnauthorized: false },

  max: 5,                      
  idleTimeoutMillis: 15_000,
  connectionTimeoutMillis: 15_000,
  statement_timeout: 15_000,
  query_timeout: 145000,

  keepAlive: true,
});
pool.on("error", (err) => {
  console.error("Unexpected PG error", err);
});

export async function withTransaction<T>(
  fn: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}