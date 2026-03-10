// services/configService.ts
import { pool, withTransaction } from "../../db";

export async function updateDriverConfig(data: {
  shiftDayFrom?: string,
  shiftDayTo?: string,
  pricePerHourDay?: number,
  shiftNightFrom?: string,
  shiftNightTo?: string,
  pricePerHourNight?: number,
  driverBataPrice?: number,
  driverBata?: string,
  farePrice?: number,
  fare?: string
}) {
  try {
    return await withTransaction(async (client) => {
      // ----------------- Day shift -----------------
      if (data.shiftDayFrom != null && data.shiftDayTo != null && data.pricePerHourDay != null) {
        const res = await client.query(
          `UPDATE config_pricing
           SET time_from=$1, time_to=$2, fare=$3
           WHERE config_type='day_shift'`,
          [data.shiftDayFrom, data.shiftDayTo, data.pricePerHourDay]
        );

        // If no row exists, insert
        if (res.rowCount === 0) {
          await client.query(
            `INSERT INTO config_pricing (config_type, time_from, time_to, fare)
             VALUES ('day_shift', $1, $2, $3)`,
            [data.shiftDayFrom, data.shiftDayTo, data.pricePerHourDay]
          );
        }
      }

      // ----------------- Night shift -----------------
      if (data.shiftNightFrom != null && data.shiftNightTo != null && data.pricePerHourNight != null) {
        const res = await client.query(
          `UPDATE config_pricing
           SET time_from=$1, time_to=$2, fare=$3
           WHERE config_type='night_shift'`,
          [data.shiftNightFrom, data.shiftNightTo, data.pricePerHourNight]
        );

        if (res.rowCount === 0) {
          await client.query(
            `INSERT INTO config_pricing (config_type, time_from, time_to, fare)
             VALUES ('night_shift', $1, $2, $3)`,
            [data.shiftNightFrom, data.shiftNightTo, data.pricePerHourNight]
          );
        }
      }

      // ----------------- Driver bata -----------------
      if (data.driverBataPrice != null || data.driverBata != null) {
        const res = await client.query(
          `UPDATE config_pricing
           SET fare=$1, config_value=$2
           WHERE config_type='driver_bata'`,
          [data.driverBataPrice ?? 0, data.driverBata ?? 'fixed']
        );

        if (res.rowCount === 0) {
          await client.query(
            `INSERT INTO config_pricing (config_type, fare, config_value)
             VALUES ('driver_bata', $1, $2)`,
            [data.driverBataPrice ?? 0, data.driverBata ?? 'fixed']
          );
        }
      }

      // ----------------- Fare one-way -----------------
      if (data.farePrice != null || data.fare != null) {
        const res = await client.query(
          `UPDATE config_pricing
           SET fare=$1, config_value=$2
           WHERE config_type='fare_one_way'`,
          [data.farePrice ?? 0, data.fare ?? '1km']
        );

        if (res.rowCount === 0) {
          await client.query(
            `INSERT INTO config_pricing (config_type, fare, config_value)
             VALUES ('fare_one_way', $1, $2)`,
            [data.farePrice ?? 0, data.fare ?? '1km']
          );
        }
      }

      return { message: "Configuration updated successfully" };
    });
  } catch (error) {
    console.error("Error updating config:", error);
    throw error;
  }
}
