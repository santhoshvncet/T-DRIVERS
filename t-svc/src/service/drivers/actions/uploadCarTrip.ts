import { uploadBufferToS3 } from "../../../utils/uploadToS3";
import { pool } from "../../db";

export const uploadCarTrip = async (body: any, files: any) => {
  try {
    const trip_id = Number(body.trip_id);
    const tripType: "startTrip" | "endTrip" = body.tripType || "startTrip";

    if (!trip_id) {
      return { status: false, msg: "trip_id is required", badRequest: true };
    }

    const filesMap = files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const hasFiles = filesMap && Object.keys(filesMap).length > 0;

    // CASE 1: No files -> return existing car_images
    if (!hasFiles) {
      const result = await pool.query(`SELECT car_images FROM trip WHERE id = $1`, [trip_id]);

      if (!result.rows.length) {
        return { status: false, msg: "Trip not found", notFound: true };
      }

      const carImages: string[] = result.rows[0].car_images || [];

      return {
        status: true,
        msg: "Car images fetched successfully",
        data: carImages,
      };
    }

    // CASE 2: Upload/re-upload to slots
    const selectResult = await pool.query(`SELECT car_images FROM trip WHERE id = $1`, [trip_id]);

    if (!selectResult.rows.length) {
      return { status: false, msg: "Trip not found", notFound: true };
    }

    let carImages: string[] = selectResult.rows[0].car_images || [];

    // Ensure 8 slots: 0-3 start, 4-7 end
    const REQUIRED_LEN = 8;
    if (carImages.length < REQUIRED_LEN) {
      carImages = [...carImages, ...Array(REQUIRED_LEN - carImages.length).fill("")];
    }

    const baseIndex = tripType === "startTrip" ? 0 : 4;
    const fieldIndexMap: Record<string, number> = {
      photo_front: 0,
      photo_right: 1,
      photo_left: 2,
      photo_back: 3,
    };

    const uploadedUrls: string[] = [];

    for (const [fieldName, filesArr] of Object.entries(filesMap)) {
      const file = filesArr?.[0];
      if (!file) continue;

      const relIndex = fieldIndexMap[fieldName];
      if (relIndex === undefined) continue;

      const slotIndex = baseIndex + relIndex;

      const url = await uploadBufferToS3(file, `trips/${trip_id}/${tripType}`);
      carImages[slotIndex] = url;
      uploadedUrls.push(url);
    }

    const updateResult = await pool.query(
      `
      UPDATE trip
      SET car_images = $1::text[]
      WHERE id = $2
      RETURNING car_images
      `,
      [carImages, trip_id]
    );

    return {
      status: true,
      msg: `Car photos for ${tripType} uploaded successfully`,
      data: updateResult.rows[0].car_images,
      uploadedUrls,
    };
  } catch (error: any) {
    console.error("Error in uploadCarTripsService:", error);
    return { status: false, msg: "Internal server error", error };
  }
};