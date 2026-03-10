import { pool } from "../../db";
import { calculateCompanyCommission } from "../../users/payments/calculateCompanyCommission";
import { commissionAmount } from "./getDriverBookingdata";

interface TripDetails {
  trip_id: number;
  owner_id: number;
  driver_id: number;
  origin_id: string;
  dest_id: string;
  scheduled_at: string | null;
  start_date: string | null;
  end_date: string | null;
  pickup_time: string;
  drop_time: string;
  duration_type: string;
  fare_amount: number;
  created_at: string;
  origin_city: string;
  origin_latitude: number;
  origin_longitude: number;
  destination_city: string;
  destination_latitude: number;
  destination_longitude: number;
  transmission: string;
  estimated_hours: number;
  board_type: string;
  brand: string;
  model_name: string;
  model_variant: string;
  car_type: string;
  owner_latitude: number;
  owner_longitude: number;
  origin_area: string;
  origin_state: string;
  destination_area: string;
  destination_state: string;
  otp: string | null;
  status: string;
  trip_type: string;
}

const getConfirmedQuery = async (driver_id: number): Promise<TripDetails[]> => {
  const query = `
    SELECT 
      t.id AS trip_id,
      t.owner_id,
      t.driver_id,
      t.origin_id,
      t.dest_id,
      t.scheduled_at,
      t.start_date,
      t.otp,
      t.status,
      t.end_date,
      t.pickup_time,
      t.drop_time,
      t.trip_type,
      t.duration_type,
      t.fare_amount,
      t.created_at,
      t.owner_latitude,
      t.owner_longitude,
      t.estimated_hours,
      oc.city_name AS origin_city,
      oc.latitude  AS origin_latitude,
      oc.longitude AS origin_longitude,
      oc.area as origin_area,
      oc.state as origin_state,
      dc.city_name AS destination_city,
      dc.area as destination_area,
      dc.state as destination_state,
      dc.latitude  AS destination_latitude,
      dc.longitude AS destination_longitude,
      c.transmission,
      c.board_type,
      cm.brand,
      cm.model_name,
      cm.model_variant,
      cm.car_type
    FROM trip t
    LEFT JOIN city oc ON oc.id = t.origin_id
    LEFT JOIN city dc ON dc.id = t.dest_id
    LEFT JOIN car c ON c.id = t.car_id
    LEFT JOIN car_model cm ON cm.id = c.model_id
    WHERE 
      t.status IN (
        'CONFIRMED',
        'ONGOING',
        'TRIP_STARTED',
        'OTP_VERIFIED',
        'START_TRIP_CAR_PHOTOS',
        'TRIP_ENDED',
        'END_TRIP_CAR_PHOTOS',
        'PAYMENT_PENDING'
      )
      AND t.driver_id = $1
    LIMIT 1;
  `;
  const result = await pool.query(query, [driver_id]);
  return result.rows as TripDetails[];
};

// UTC -> IST date only
const toISTDate = (input: string | null): string | null => {
  if (!input) return null;
  const d = new Date(input);
  d.setHours(d.getHours() + 5);
  d.setMinutes(d.getMinutes() + 30);
  return d.toISOString().slice(0, 10);
};

export const getConfirmedTrip = async (driverIdParam: any) => {
  try {
    const driverId = Number(driverIdParam);

    if (!driverId || isNaN(driverId)) {
      return { status: false, msg: "driver_id is required", badRequest: true };
    }

    let trip = await getConfirmedQuery(driverId);

    if (trip.length > 0) {
      trip = await Promise.all(trip.map(async (t) => ({
        ...t,
        fare_amount:  await commissionAmount(t.fare_amount , t.estimated_hours, t.origin_id, t.dest_id),
        start_date: toISTDate(t.start_date),
        end_date: toISTDate(t.end_date),
        scheduled_at: toISTDate(t.scheduled_at),
      })));

      await pool.query(`UPDATE driver SET status_id = 2 WHERE id = $1`, [driverId]);
    }

    return { status: true, data: { driverId: String(driverIdParam), trip } };
  } catch (err) {
    console.error("ConfirmedTrip Service Error:", err);
    return { status: false, msg: "Server Error", error: err };
  }
};