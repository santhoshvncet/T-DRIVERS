import { useCallback, useState } from "react";
import { getCarImage } from "../common/getCarImage";

export const useCarImage = () => {
  const [carList, setCarList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCarImage = useCallback(async (owner_id: number) => {
     console.log("Fetching car images for owner_id:", owner_id);
    if (!owner_id) return [];
    setLoading(true);
    try {
      const res = await getCarImage({ owner_id });
      const list = res?.data?.data || [];
      setCarList(list);
      return list;
    } catch (error) {
      console.error("Error fetching car image:", error);
      setCarList([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { carList, fetchCarImage, loading };
};
