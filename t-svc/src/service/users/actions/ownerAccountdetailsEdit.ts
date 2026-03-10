import { pool } from "../../db";

interface UpdateProfilePayload {
  name: string;
  email: string;
  address: string;
  phone: string;
  city_id: number;
  state: string;
}

const UPDATE_USERS_SQL = `
  UPDATE users SET
    name = $1,
    email = $2,
    address = $3,
    city_id = $4,
    state = $5,
    updated_at = NOW()
  WHERE phone = $6
  RETURNING *;
`;

export const updateOwnerProfile = async (payload: UpdateProfilePayload) => {
  try {
    console.log("Updating user profile with payload:", payload);

    const userRes = await pool.query(UPDATE_USERS_SQL, [
      payload.name,
      payload.email,
      payload.address,
      payload.city_id,
      payload.state,
      payload.phone,
    ]);

    if (userRes.rows.length === 0) {
      return { status: false, error: "User not found" };
    }

    return {
      status: true,
      message: "Profile updated successfully",
      data: userRes.rows[0],
    };
  } catch (error: any) {
    console.error("Update user profile error:", error);

    // email unique constraint handling
    if (error.code === "23505" || error.constraint === "email_unique") {
      return {
        status: false,
        error: "Email already exists",
      };
    }

    return {
      status: false,
      error: error.message || "Something went wrong",
    };
  }
};