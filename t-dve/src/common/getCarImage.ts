import axiosInstance from "../api/axiosinstance";
import constants from "../lib/constants";

export const getCarImage = async (params: { owner_id: number }) => {
  
  console.log("Calling API with owner_id:", params.owner_id);
  try {
    
    const response = await axiosInstance.get(constants.GET_CAR_IMAGE_API, {
      params: { owner_id: params.owner_id },
    });
    return response;
  } catch (error) {
    console.error("Error fetching car image:", error);
    throw error;
  }
};

