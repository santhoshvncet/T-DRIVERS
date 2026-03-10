import { pool } from "../../db";

const getTripdetailsByOwner = async (ownerId: any)=> {
  try {
    const owner_id = Number(ownerId);

    if (isNaN(owner_id)) {
      return { status: false, msg: "Invalid ownerId", data: null as any };
    }

    const query = `
      SELECT 
        t.id AS trip_id,
        t.origin_id,
        t.dest_id,
        t.start_date,
        t.end_date,
        t.pickup_time,
        t.drop_time,
        t.otp,
        t.driver_id,
        t.driver_allowance,
        t.trip_type,
        t.status,

        oc.city_name AS origin_city,
        oc.latitude AS origin_latitude,
        oc.longitude AS origin_longitude,
        dc.city_name AS dest_city,
        dc.latitude AS dest_latitude,
        dc.longitude AS dest_longitude,

        uc.city_name AS driver_city,
        u.profile_url AS driver_profile_url,

        d.id AS d_id,
        d.full_name AS d_full_name,
        d.phone AS d_phone,
        d.age AS d_age,
        d.address AS d_address,
        d.email AS d_email,
        d.state AS d_state

      FROM trip t
      LEFT JOIN owner o ON o.id = t.owner_id     
      LEFT JOIN driver d ON d.id = t.driver_id
      LEFT JOIN users u ON u.id = d.user_id          
      LEFT JOIN city oc ON oc.id = t.origin_id
      LEFT JOIN city dc ON dc.id = t.dest_id
      LEFT JOIN city uc ON uc.id = u.city_id        
      WHERE t.owner_id = $1
        AND t.status IN ('CONFIRMED', 'PAYMENT_PENDING')
        AND t.deleted_at IS NULL
      ORDER BY t.created_at DESC
      LIMIT 1;
    `;

    const { rows, rowCount } = await pool.query(query, [owner_id]);

    if (rowCount === 0) {
      return {
        status: false,
        msg: "No active trip found for this owner",
        data: null as any,
      };
    }

    const r = rows[0];

    const driver = r.d_id
      ? {
          id: r.d_id,
          name: r.d_full_name,
          phone: r.d_phone,
          age: r.d_age,
          address: r.d_address,
          userCity: r.driver_city,
          profileUrl: r.driver_profile_url,
          email: r.d_email,
          state: r.d_state,
        }
      : null;

    const trip = {
      id: r.trip_id,
      status: r.status,
      from: r.origin_city || null,
      to: r.dest_city || null,
      origin_latitude: r.origin_latitude,
      origin_longitude: r.origin_longitude,
      dest_latitude: r.dest_latitude,
      dest_longitude: r.dest_longitude,
      startDate: r.start_date,
      endDate: r.end_date,
      pickupTime: r.pickup_time,
      dropTime: r.drop_time,
      otp: r.otp,
      driver_id: r.driver_id,
      driver_allowance: r.driver_allowance,
      trip_type: r.trip_type,
    };

    return {
      status: true,
      msg: "Data fetched successfully",
      data: { trip, driver },
    };
  } catch (err) {
    console.error("ERROR in getTripdetailsByOwner:", err);
    return { status: false, msg: "Server error", error: err, data: null as any };
  }
};

export default getTripdetailsByOwner;