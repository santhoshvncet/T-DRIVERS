import { pool } from "../../db";
import { calculateCompanyCommission } from "../../users/payments/calculateCompanyCommission";

/* keep your helpers as-is */
export const formatDateOnly = (value: Date | string | null) => {
  if (!value) return null;
  return new Date(value).toISOString().split("T")[0];
};

export const formatTimeOnly = (value: string | null) => {
  if (!value) return null;
  return value;
};

export const formatTimestamp = (value: Date | string | null) => {
  if (!value) return null;
  return new Date(value).toISOString();
};


  export const commissionAmount  = async(fare_amount:any , estimated_hours:any, origin_id:any, dest_id:any)=>{
    const commission = await calculateCompanyCommission(3, String(24966), String(23506));
    console.log('commision amout',1600 - commission);
    return fare_amount - commission / 100;
  }


const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};

export const getTripsService = async (driver_id?: number | null) => {
  const query = `
    SELECT
      t.id AS trip_id,
      t.owner_id,
      t.driver_id,
      t.origin_id,
      t.dest_id,
      t.scheduled_at,
      t.start_date::text     AS start_date,
      t.end_date::text       AS end_date,
      t.pickup_time::text    AS pickup_time,
      t.drop_time::text      AS drop_time,
      t.trip_type,
      t.fare_amount,
      t.estimated_hours,
      t.created_at,
      oc.city_name AS origin_city,
      oc.area      AS origin_area,
      oc.state     AS origin_state,
      oc.latitude  AS origin_latitude,
      oc.longitude AS origin_longitude,
      dc.city_name AS destination_city,
      dc.area      AS destination_area,
      dc.state     AS destination_state,
      dc.latitude  AS destination_latitude,
      dc.longitude AS destination_longitude,
      c.transmission,
      c.board_type,
      cm.brand,
      cm.model_name,
      cm.model_variant,
      cm.car_type,
      di.driver_interest_type,
      (
        ST_DistanceSphere(
          ST_MakePoint(oc.longitude, oc.latitude),
          ST_MakePoint(d.driver_longitude, d.driver_latitude)
        ) / 1000
      ) AS distance_km
    FROM trip t
    JOIN city oc ON oc.id = t.origin_id
    LEFT JOIN city dc ON dc.id = t.dest_id
    JOIN driver d ON d.id = $1
    LEFT JOIN car c ON c.id = t.car_id
    LEFT JOIN car_model cm ON cm.id = c.model_id
    LEFT JOIN driver_interest di
      ON di.trip_id  = t.id
     AND di.driver_id = d.id
     AND di.deleted_at IS NULL
    WHERE
      t.status = 'CREATED'
      AND oc.latitude IS NOT NULL
      AND oc.longitude IS NOT NULL
      AND d.driver_latitude IS NOT NULL
      AND d.driver_longitude IS NOT NULL
      AND d.status_id = 1
      AND (di.id IS NULL OR di.driver_interest_type = 'INTERESTED')
      AND (
        ST_DistanceSphere(
          ST_MakePoint(oc.longitude, oc.latitude),
          ST_MakePoint(d.driver_longitude, d.driver_latitude)
        ) / 1000
      ) <= 15
    ORDER BY distance_km ASC, t.created_at DESC;
  `;

  const result = await pool.query(query, [driver_id]);


  const trips = await Promise.all(
    result.rows.map(async (trip: any) => ({
      ...trip,
      start_date: formatDateOnly(trip.start_date),
      end_date: formatDateOnly(trip.end_date),
      pickup_time: formatTimeOnly(trip.pickup_time),
      drop_time: formatTimeOnly(trip.drop_time),
      scheduled_at: formatTimestamp(trip.scheduled_at),
      created_at: formatTimestamp(trip.created_at),

      fare_amount: await commissionAmount(
        trip.fare_amount,
        trip.estimated_hours,
        trip.origin_id,
        trip.dest_id,
      ),

      distance_km:
        trip.origin_latitude && trip.destination_latitude
          ? calculateDistanceKm(
              Number(trip.origin_latitude),
              Number(trip.origin_longitude),
              Number(trip.destination_latitude),
              Number(trip.destination_longitude),
            )
          : null,
    }))
  );
  
  return trips;
};

/* wrapper service for router use */
export const getTripsByUser = async (userIdParam: any) => {
  try {
    const userId = userIdParam ? Number(userIdParam) : null;

    if (!userId || isNaN(userId)) {
      return { status: false, msg: "Invalid user_id", badRequest: true };
    }

    const driver = await pool.query(
      `SELECT id FROM driver WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId],
    );

    if (driver.rows.length === 0) {
      return { status: false, msg: "Driver not found", notFound: true };
    }

    const driver_id = driver.rows[0].id;
    const trips = await getTripsService(driver_id);

    return { status: true, data: trips };
  } catch (err) {
    console.error("GET Trips Service Error:", err);
    return { status: false, msg: "Server Error", error: err };
  }
};