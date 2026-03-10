import { pool } from "../../db";

export const setPrimaryCar = async (car_id: number) => {
  try {
    // Set all other cars to non-primary for the selected car's owner
    await pool.query(
      "UPDATE car SET is_primary = false WHERE owner_id = (SELECT owner_id FROM car WHERE id = $1)",
      [car_id]
    );

    // Set the selected car as primary
    await pool.query("UPDATE car SET is_primary = true WHERE id = $1", [car_id]);

    return { success: true, message: "Car set as primary" };
  } catch (err) {
    console.error("Error setting car as primary:", err); // Log the error
    throw new Error("Unable to set car as primary"); // Throw an error if something goes wrong
  }
};
