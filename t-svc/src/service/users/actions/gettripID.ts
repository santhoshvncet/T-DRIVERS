import { pool } from "../../db";

const getTripId = async (ownerId: any) => {
  try {
    const owner_id = Number(ownerId);

    if (isNaN(owner_id)) {
      return {
        status: false,
        msg: "Invalid owner_id",
        data: null,
      };
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
  oc.area AS origin_area,     
  oc.city_name AS origin_city,
  oc.state AS origin_state,
  oc.latitude AS origin_latitude,
  oc.longitude AS origin_longitude,
  dc.area AS dest_area,
  dc.city_name AS dest_city,
  dc.state AS dest_state,
  dc.latitude AS dest_latitude,
  dc.longitude AS dest_longitude,
  uc.city_name AS driver_city,
  d.profile_photo_url AS driver_profile_url,
  d.id AS d_id,
  u.name AS d_full_name,
  u.phone AS d_phone,
  d.age AS d_age,
  u.address AS d_address,
  u.email AS d_email,
  u.state AS d_state
FROM trip t
LEFT JOIN owner o ON o.id = t.owner_id     
LEFT JOIN driver d ON d.id = t.driver_id
LEFT JOIN users u ON u.id = d.user_id          
LEFT JOIN city oc ON oc.id = t.origin_id
LEFT JOIN city dc ON dc.id = t.dest_id
LEFT JOIN city uc ON uc.id = u.city_id        
WHERE t.owner_id = $1
  AND t.status IN (
    'CONFIRMED','ONGOING','TRIP_STARTED',
    'OTP_VERIFIED','START_TRIP_CAR_PHOTOS','TRIP_ENDED',
    'END_TRIP_CAR_PHOTOS','PAYMENT_PENDING','PAYMENT_COMPLETED'
  )
  AND t.deleted_at IS NULL
ORDER BY t.created_at DESC;
    `;

    const result = await pool.query(query, [owner_id]);

    if (result.rowCount === 0) {
      return {
        status: true,
        data: { trip: null, driver: null },
        msg: "No active trip found for this trip id",
      };
    }

    const r = result.rows[0];

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
      from: `${r.origin_area}, ${r.origin_city}, ${r.origin_state}`,
      to: `${r.dest_area}, ${r.dest_city}, ${r.dest_state}`,
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
      data: { trip, driver },
      msg: "Data fetched successfully",
    };
  } catch (err) {
    console.error("ERROR in getTripId:", err);
    return {
      status: false,
      msg: "Server error",
      error: err,
      data: null,
    };
  }
};

export default getTripId;
