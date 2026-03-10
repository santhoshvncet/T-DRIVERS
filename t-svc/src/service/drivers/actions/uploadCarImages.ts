import { Request, Response } from "express";
import { pool } from "../../db";

export const saveCarImages = async (req: Request, res: Response) => {
  console.log("BODY 👉", req.body);

  const trip_id = req.body?.trip_id;
  const car_images = req.body?.car_images;

  if (
    trip_id === undefined ||
    !Array.isArray(car_images) ||
    car_images.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "trip_id or Car photos not found",
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE trip
      SET car_images = $1,
          updated_at = NOW()
      WHERE id = $2
      AND deleted_at IS NULL
      RETURNING id, car_images;
      `,
      [car_images, trip_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Car photos saved successfully",
      data: result.rows[0],
    });

  } catch (err) {
    console.error("DB ERROR 👉", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

