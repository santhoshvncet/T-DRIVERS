import { withTransaction } from "../../db";
import { sendWelcomeEmailOwner } from "../../email/sendMailFinal";
import { createAndSendNotification } from "./notification";

interface RegisterPayload {
  name: string;
  email: string;
  address: string;
  phone: string;
  city_id: number;
  state: string;
}

const UPDATE_USER_SQL = `
  UPDATE users SET
    name = $1,
    email = COALESCE(NULLIF($2, ''), email),
    city_id = $3,
    state = $4,
    address = $5,
    role = 'Owner',
    landing_page = 'CarDetailsForm',
    updated_at = NOW()
  WHERE phone = $6
  RETURNING id;
`;

const UPSERT_OWNER_SQL = `
  INSERT INTO owner (users_id, is_active, created_at, updated_at)
  VALUES ($1, true, NOW(), NOW())
  ON CONFLICT (users_id) DO UPDATE
  SET is_active = true, updated_at = NOW()
  RETURNING *;
`;

const registerUser = async (payload: RegisterPayload) => {
  console.log("Registering user:", payload.phone);

  try {
    if (!payload.phone) {
      return { status: false, error: "Phone number is required" };
    }

    const name = payload.name?.trim();
    const email = payload.email?.trim().toLowerCase() || "";
    const state = payload.state?.trim();
    const address = payload.address?.trim();

    /* ---------------- TRANSACTION ---------------- */
    const { user_id, owner } = await withTransaction(async (client) => {
      const userRes = await client.query(UPDATE_USER_SQL, [
        name,
        email,
        payload.city_id,
        state,
        address,
        payload.phone,
      ]);

      if (userRes.rowCount === 0) {
        throw new Error("USER_NOT_FOUND");
      }

      const user_id = userRes.rows[0].id;

      const ownerRes = await client.query(UPSERT_OWNER_SQL, [user_id]);

      return { user_id, owner: ownerRes.rows[0] };
    });
    /* -------------- END TRANSACTION -------------- */

    /* ---------- POST-COMMIT SIDE EFFECTS ---------- */
    setImmediate(() => {
      createAndSendNotification({
        title: "🎉 Account Created Successfully",
        message: `Welcome ${name}! Your account is ready. Start booking drivers 🧑‍✈️ and enjoy comfortable rides 🚗.`,
        userIds: [user_id],
      }).catch(e =>
        console.error("[registerUser] Notification failed:", e)
      );

      if (email && name) {
        sendWelcomeEmailOwner(email, name).catch(e =>
          console.error("[registerUser] Welcome email failed:", e.message)
        );
      }
    });

    return {
      status: true,
      user_id,
      owner,
    };

  } catch (err: any) {
    if (err.code === "23505") {
      return { status: false, error: "Email already exists" };
    }

    if (err.message === "USER_NOT_FOUND") {
      return { status: false, error: "User not found for this phone number" };
    }

    console.error("Error in registerUser:", err);
    return { status: false, error: "Something went wrong" };
  }
};

export default registerUser;
