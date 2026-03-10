import { pool } from "../../db";

/**
 * Update landing page for a user
 */
export const landingPage = async (landing_page: string, id: number) => {
  if (!landing_page) {
    return { message: "landing_page is required" };
  }

  try {
    await pool.query(
      `
      UPDATE users
      SET landing_page = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      [landing_page, id]
    );

    return {
      status: true,
      message: "Landing page updated successfully",
    };
  } catch (error) {
    console.error("landingPage error:", error);
    return {
      status: false,
      message: "Internal Server Error",
    };
  }
};

/**
 * Update user role
 * NOTE: is_driver column is REMOVED from DB
 * Role is now the single source of truth
 */
export const updateUserRole = async (
  role: "Driver" | "Owner",
  id: number
) => {
  if (!role) {
    return { message: "role is required" };
  }

  try {
    await pool.query(
      `
      UPDATE users
      SET role = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      [role, id]
    );

    return {
      status: true,
      message: "User role updated successfully",
    };
  } catch (error) {
    console.error("updateUserRole error:", error);
    return {
      status: false,
      message: "Internal Server Error",
    };
  }
};