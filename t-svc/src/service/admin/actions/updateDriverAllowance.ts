import { pool, withTransaction } from "../../db";
import { createAndSendNotification } from "../../users/actions/notification";

export async function updateDriverAllowance(
  tripId: number,
  driverAllowance: number,
) {
  const result = await withTransaction(async (client) => {
    const query = await client.query(
      `
    UPDATE trip
    SET
      driver_allowance = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      driver_allowance,
      owner_id
    `,
      [tripId, driverAllowance],
    );

    return query;
  });

  const trip = result.rows[0];

  const ownerRes = await pool.query(
    `
    SELECT u.id AS owner_user_id
    FROM trip t
    JOIN owner o ON o.id = t.owner_id
    JOIN users u ON u.id = o.users_id
    WHERE t.id = $1
      AND u.external_id IS NOT NULL
    `,
    [tripId],
  );

  if (ownerRes.rowCount) {
    const ownerUserId = ownerRes.rows[0].owner_user_id;
    await createAndSendNotification({
      title: "Driver Allowance Added 💰",
      message: `Admin has added a driver allowance of ₹${trip.driver_allowance} for your trip.`,
      userIds: [ownerUserId],
    });
  }

  // If no rows were updated, trip was not found
  return result.rows[0] || null;
}