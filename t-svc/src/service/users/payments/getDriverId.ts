import { AppError } from "../../../config/errorHandle";
import { pool } from "../../db";



const GET_DRIVER_ID_BY_TRIP = `
SELECT d.user_id
FROM trip t
JOIN driver d ON d.id = t.driver_id
WHERE t.id = $1;
`;

export const getDriverIdByTrip = async (tripId: number): Promise<number> => {
  const result = await pool.query(GET_DRIVER_ID_BY_TRIP, [tripId]);

  if (result.rowCount === 0) {
    throw new AppError(`Trip not found for trip_id=${tripId}`, 404);
  }

  const userId = result.rows[0].user_id;



  if (!userId) {
    throw new AppError(
      `Driver not assigned for trip_id=${tripId}`,
      400
    );
  }

  return userId;
};
