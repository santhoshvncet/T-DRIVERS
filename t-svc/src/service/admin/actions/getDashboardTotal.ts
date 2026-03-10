import { pool } from "../../db";

export async function getDashboardTotal() {
  try {
    const tripQuery = await pool.query(
      `SELECT COUNT(*)::int AS total FROM trip`
    );
    const tripCount = tripQuery.rows[0].total;

    const driverQuery = await pool.query(
      `SELECT COUNT(*)::int AS total FROM driver`
    );
    const driverCount = driverQuery.rows[0].total;

    const ownerQuery = await pool.query(
      `SELECT COUNT(*)::int AS total FROM owner`
    );
    const ownerCount = ownerQuery.rows[0].total;

    const driverNotVerifiedQuery = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM driver d
      JOIN driver_status ds
        ON d.status_id = ds.id
      WHERE ds.name = 'non-active'
    `);
    const driverNotVerifiedCount = driverNotVerifiedQuery.rows[0].total;

    const ownerNotVerifiedQuery = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM owner o WHERE is_active = true
    `);
    const ownerNotVerifiedCount = ownerNotVerifiedQuery.rows[0].total;

    const approvalCount = driverNotVerifiedCount + ownerNotVerifiedCount;

    const rolesQuery = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM admin
      WHERE NOT 'Super Admin' = ANY(role)
    `);
    const rolesCount = rolesQuery.rows[0].total;

    return {
      approvalCount,
      tripCount,
      driverCount,
      ownerCount,
      rolesCount,
    };
  } catch (error) {
    console.error("Error fetching dashboard totals:", error);
    throw error;
  }
}
