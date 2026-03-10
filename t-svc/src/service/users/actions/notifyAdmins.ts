import { pool } from "../../db";
import { createAndSendNotification } from "./notification";

export async function notifyAdmins(trip: any) {
  try {
    if (trip.duration_type !== "oneway") return;

    const adminRes = await pool.query(`
      SELECT id
      FROM users
      WHERE role ILIKE 'admin'
        AND external_id IS NOT NULL
    `);

    const adminUserIds = adminRes.rows.map(r => r.id).filter(Boolean);
    if (!adminUserIds.length) return;

    await createAndSendNotification({
      title: "🚗 New One-Way Trip Created",
      message: `A new one-way trip has been created from city ${trip.origin_id} to ${trip.dest_id}. Payment pending.`,
      userIds: adminUserIds,
    });

  } catch (err) {
    console.error("[notifyAdmins] Failed:", err);
  }
}
