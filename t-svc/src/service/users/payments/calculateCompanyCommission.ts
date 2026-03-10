import { calculateDistanceKm } from "../actions/calculateDistance";

export const calculateCompanyCommission = async (
  tripHours: number,
  origin_id: string,
  dest_id: string
): Promise<number> => {

  let tripDistance = 0;

  if (origin_id && dest_id) {
    try {
      tripDistance = await calculateDistanceKm(origin_id, dest_id);
      console.log("trip distance", tripDistance);
    } catch (error) {
      console.warn("Distance calculation failed, defaulting to 0 km", error);
    }
  }

  console.log("trip hours", tripHours);


  if (tripHours >= 24) return 300 * 100;
  if (tripHours >= 12) return 200 * 100;

 

  if (tripDistance > 100) {
    if (tripHours >= 24) return 300 * 100;
    return 200 * 100;
  }



  if (tripHours <= 5) return 50 * 100;
  if (tripHours <= 8) return 100 * 100;
  if (tripHours <= 11) return 150 * 100;
  if (tripHours <= 24) return 200 * 100;

  return 300 * 100;
};
