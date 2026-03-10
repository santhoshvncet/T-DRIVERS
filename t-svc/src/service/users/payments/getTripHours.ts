import { pool } from "../../db";
import { AppError } from "../../../config/errorHandle";

interface TripDetails {
  tripHours: number;
  origin_id: string;
  dest_id: string;
}

const GET_COMMISSION = `
  SELECT
    CEIL(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600) AS trip_hours,
    origin_id,
    dest_id
  FROM trip
  WHERE id = $1
    AND started_at IS NOT NULL
    AND completed_at IS NOT NULL;
`;

export const getTripHoursAndRoute = async (
  tripId: number
): Promise<TripDetails> => {
  const result = await pool.query(GET_COMMISSION, [tripId]);

  if (result.rowCount === 0) {
    throw new AppError("Trip not completed or not found", 400);
  }

  const row = result.rows[0];

  return {
    tripHours: Number(row.trip_hours),
    origin_id: row.origin_id,
    dest_id: row.dest_id,
  };
};
