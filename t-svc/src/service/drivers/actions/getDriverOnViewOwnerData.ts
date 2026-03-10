import { pool } from "../../db";

export const getOwnerDetails = async (ownerIdParam: any) => {
  try {
    const ownerId = Number(ownerIdParam);

    if (!ownerId || isNaN(ownerId)) {
      return { status: false, msg: "Invalid ownerId", badRequest: true };
    }

    const query = `
      SELECT
        o.id AS owner_id,
        u.name AS owner_name,
        u.address,
        o.created_at,
        u.phone AS owner_phone,
        u.profile_url AS owner_avatar,
        c.car_insurance,
        c.rc
      FROM owner o
      LEFT JOIN users u ON u.id = o.users_id
      LEFT JOIN car c ON c.owner_id = o.id AND c.deleted_at IS NULL
      WHERE o.id = $1;
    `;

    const result = await pool.query(query, [ownerId]);

    if (result.rows.length === 0) {
      return { status: false, msg: "Owner not found", notFound: true };
    }

    return { status: true, data: result.rows[0], msg: "Owner details fetched successfully" };
  } catch (error) {
    console.error("Error fetching owner details:", error);
    return { status: false, msg: "Server error", error };
  }
};