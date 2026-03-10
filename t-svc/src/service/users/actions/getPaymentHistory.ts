import { pool } from "../../db";

const getPaymentHistoryByOwner = async (ownerId: any) => {
  try {
    const owner_id = Number(ownerId);

    if (!owner_id || isNaN(owner_id)) {
      return { status: false, msg: "Invalid ownerId" };
    }

    const query = `
      SELECT
        pd.id                      AS payment_id,
        pd.razorpay_payment_id,
        pd.payment_status          AS payment_status,
        pd.amount / 100.0          AS amount_inr,
        pd.currency,
        pd.created_at              AS payment_date,

        d.id                       AS driver_id,
        d.profile_photo_url        AS driver_profile_photo_url,

        t.id                       AS trip_id,
        t.start_date,
        t.end_date,
        t.pickup_time,
        t.drop_time,
        t.fare_amount,

        origin.area      AS origin_area,
        origin.city_name AS origin_city,
        origin.state     AS origin_state,

        dest.area        AS dest_area,
        dest.city_name   AS dest_city,
        dest.state       AS dest_state,

        u.name                     AS driver_name,
        u.phone                    AS driver_phone,

        pd.payment_json->>'method' AS payment_method,
        pd.payment_json->>'email'  AS payer_email

      FROM payment_details pd
      JOIN trip t           ON t.id = pd.trip_id
      LEFT JOIN city origin ON origin.id = t.origin_id
      LEFT JOIN city dest   ON dest.id   = t.dest_id
      LEFT JOIN driver d    ON d.id      = t.driver_id
      LEFT JOIN users u     ON d.user_id = u.id

      WHERE t.owner_id = $1
        AND t.deleted_at IS NULL
      ORDER BY pd.created_at DESC;
    `;

    const result = await pool.query(query, [owner_id]);

    const payment_status =
      result.rows.length > 0 ? result.rows[0].payment_status : null;

    const payments = result.rows.map((r: any) => ({
      ...r,
      origin_city: `${r.origin_area}, ${r.origin_city}, ${r.origin_state}`,
      dest_city: `${r.dest_area}, ${r.dest_city}, ${r.dest_state}`,
    }));

    return {
      status: true,
      data: { payment_status, payments },
      msg: "Payment history fetched",
    };
  } catch (err) {
    console.error("ERROR in getPaymentHistoryByOwner:", err);
    return { status: false, msg: "Server error", error: err };
  }
};

export default getPaymentHistoryByOwner;