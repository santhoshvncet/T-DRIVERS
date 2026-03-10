import { Request, Response } from "express";
import { pool } from "../../db";

export const getDashboardCounts = async (req: Request, res: Response) => {

  try {
    // 🔹 Count Owners
    const ownerResult = await pool.query(
      `
      SELECT COUNT(*)::int AS owner_count
      FROM users
      WHERE LOWER(role) = 'owner'
      `
    );

    // 🔹 Count Drivers
    const driverResult = await pool.query(
      `
      SELECT COUNT(*)::int AS driver_count
      FROM users
      WHERE LOWER(role) = 'driver'
      `
    );

    // 🔹 Count Trips
    const tripResult = await pool.query(
      `
      SELECT COUNT(*)::int AS trip_count
      FROM trip
      `
    );

    return res.json({
      status: true,
      data: {
        owners: ownerResult.rows[0].owner_count,
        drivers: driverResult.rows[0].driver_count,
        trips: tripResult.rows[0].trip_count,
      },
      message: "Dashboard counts fetched successfully",
    });
  } catch (error) {
    console.error("Dashboard Count Error:", error);

    return res.status(500).json({
      status: false,
      message: "DB error",
    });
  }
};
