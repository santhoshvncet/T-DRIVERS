import { pool, withTransaction } from "../../db";
import { sendWelcomeEmaildriver } from "../../email/sendMailFinal";
import { createAndSendNotification } from "../../users/actions/notification";


interface InsertDriverPayload {
  name: string;
  phone: string;
  email: string;
  age: number;
  address: string;
  state: string;
  city_id: number;
}

const UPDATE_USER_SQL = `
  UPDATE users SET
    name = $1,
    email = $2,
    address = $3,
    city_id = $4,
    state = $5,
    role = 'Driver',
    landing_page = 'DriverDetailPage',
    updated_at = NOW()
  WHERE phone = $6
  RETURNING id;
`;

const UPSERT_DRIVER_SQL = `
  INSERT INTO driver (
    user_id,
    age,
    status_id,
    created_at,
    updated_at
  )
  VALUES ($1,$2,2,NOW(),NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET
    age = EXCLUDED.age,        
    updated_at = NOW()
  RETURNING *;
`;

const insertDriver = async (payload: InsertDriverPayload) => {
  console.log("Registering driver with payload:", payload);

  try {
    // UPDATE USER (same structure as example)
    const userRes = await pool.query(UPDATE_USER_SQL, [
      payload.name,
      payload.email,
      payload.address,
      payload.city_id,
      payload.state,
      payload.phone,
    ]);

    if (userRes.rowCount === 0) {
      return {
        status: false,
        error: "User with provided phone not found.",
      };
    }

    const user_id = userRes.rows[0].id;

    // UPSERT DRIVER
    const driverRes = await withTransaction(async (client) => {
    const driverRes = await client.query(UPSERT_DRIVER_SQL, [
      user_id,
      payload.age,
      ]);
      return driverRes
    });

       try {
      await createAndSendNotification({
        title: "🎉 Account Created Successfully",
        message: `Welcome ${payload.name} Now you may begin accepting ride requests.`,
        userIds: [user_id],
      });
    } catch (notifyError) {
      console.error("Driver notification failed:", notifyError);
    }
        try {
      if (payload.email && payload.name) {
        console.log("here tthe driver welcome mail")
        await sendWelcomeEmaildriver(payload.email, payload.name);
      }
    } catch (emailError: any) {
      console.log("Driver welcome email failed:", emailError.message);
      // DO NOT throw
    }

    return {
      status: true,
      message: "Driver registered successfully!",
      user_id,
      driver: driverRes.rows[0],
    };
  } catch (err: any) {
   
    if (err.code === "23505") {
      return {
        status: false,
        error: "Email already exists",
      };
    }

    console.error("Error in insertDriver:", err);

    return {
      status: false,
      error: "Something went wrong",
    };
  }
};

export default insertDriver;
