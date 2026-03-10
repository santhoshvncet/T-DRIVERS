import { pool } from "../../db";

const toTitle = (s?: string | null) =>
  (s || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const ONGOING_STATUSES = [
  "PAYMENT_PENDING",
  "CONFIRMED",
  "ONGOING",
  "TRIP_STARTED",
  "OTP_VERIFIED",
  "START_TRIP_CAR_PHOTOS",
  "TRIP_ENDED",
  "END_TRIP_CAR_PHOTOS",
];

const COMPLETED_STATUSES = ["COMPLETED", "PAYMENT_COMPLETED"];
const CREATED_STATUSES = ["CREATED"];

export const getTripStatusByOwner = async (ownerId: any) => {
  try {
    const owner_id = Number(ownerId);

    if (!owner_id || isNaN(owner_id)) {
      return { status: false, msg: "ownerId is required" };
    }

    const query = `
      SELECT 
        t.id AS trip_id,
        t.start_date,
        t.end_date,
        t.pickup_time,
        t.drop_time,
        t.status AS trip_status,

        oc.id AS origin_id,
        oc.area AS origin_area,
        oc.city_name AS origin_city,
        oc.state AS origin_state,

        dc.id AS dest_id,
        dc.area AS dest_area,
        dc.city_name AS dest_city,
        dc.state AS dest_state,

        u.name AS driver_name,
        d.profile_photo_url,
        d.id AS driver_id
      FROM trip t
      LEFT JOIN driver d ON d.id = t.driver_id
      LEFT JOIN users u ON u.id = d.user_id
      LEFT JOIN city oc ON oc.id = t.origin_id
      LEFT JOIN city dc ON dc.id = t.dest_id
      WHERE t.owner_id = $1
        AND t.deleted_at IS NULL
      ORDER BY t.created_at DESC;
    `;

    const { rows } = await pool.query(query, [owner_id]);

    const result = {
      ongoing: [] as any[],
      completed: [] as any[],
      created: [] as any[],
    };

    rows.forEach((r: any) => {
      const fromLabel = r.origin_area
        ? `${toTitle(r.origin_area)}, ${toTitle(r.origin_city)}`
        : "-";

      const toLabel = r.dest_area
        ? `${toTitle(r.dest_area)}, ${toTitle(r.dest_city)}`
        : "-";

      const trip = {
        tripId: r.trip_id,
        from: fromLabel,
        to: toLabel,
        startDate: r.start_date,
        endDate: r.end_date,
        pickupTime: r.pickup_time,
        dropTime: r.drop_time,
        driverName: r.driver_name || null,
        driverProfileURL: r.profile_photo_url || null,
        driverId: r.driver_id || null,
      };

      const status = r.trip_status;
      if (ONGOING_STATUSES.includes(status)) result.ongoing.push(trip);
      else if (COMPLETED_STATUSES.includes(status)) result.completed.push(trip);
      else if (CREATED_STATUSES.includes(status)) result.created.push(trip);
    });

    return {
      status: true,
      data: result,
      msg: "Trip status fetched",
    };
  } catch (err) {
    console.error("Get Trip Status ERROR:", err);
    return { status: false, msg: "Internal Server Error", error: err };
  }
};