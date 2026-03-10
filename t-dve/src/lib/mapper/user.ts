import type { UserAuth, UserMapped } from "../../provider/types/userProvider";

const getUser = (userData: UserAuth): UserMapped => {
  return {
  userId: userData.id,
  language: userData.language,
  page: userData.landing_page,
  email: userData.email,
  phone: userData.phone,
  name: userData?.name,
  is_driver: userData?.is_driver || false,
  userDirection: "",
  landing_page: userData.landing_page || "",
  owner_id: userData.owner_id || null,
  driver_id: userData.driver_id || null,
  role: userData.role || "",
  access: userData.access || [],
  driver_status: userData?.driver_status
};
};

export default {getUser}
