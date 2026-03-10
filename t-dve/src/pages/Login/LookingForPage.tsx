import React, { useContext } from "react";
import { IonImg } from "@ionic/react";
import PageLayout from "../../modules/common/layout/PageLayout";
import useApiCall from "../../hooks/useApi";
import axiosInstance from "../../api/axiosinstance";
import constants from "../../lib/constants";
import { IUserContext } from "../../provider/types/userProvider";
import { UserContext } from "../../provider/UserProvider";
import useNavigationHistory from "../../hooks/useNavigationHistory";
import steeringIcon from "../../assets/steering.png";
import carIcon from "../../assets/Carimage.svg";

const LookingForPage: React.FC = () => {
  const { user } = useContext<IUserContext>(UserContext);
  const { pushLatest } = useNavigationHistory();
  const { OWNER_PROFILE_FORM, DRIVER_PROFILE_FORM } =
    constants.USER_LANDING_PAGE;
  const [update_landing_page] = useApiCall(axiosInstance.post);

  const handleDriverClick = async () => {
    await updateLandingPage(false, OWNER_PROFILE_FORM);
  };

  const handleReadyClick = async () => {
    await updateLandingPage(true, DRIVER_PROFILE_FORM);
  };

  const updateLandingPage = async (
    is_driver: boolean,
    landing_page: string,
  ) => {
    await update_landing_page(
      [
        constants.UPDATE_LANDING_PAGE,
        {
          landing_page: landing_page,
          user_id: user.userId,
          is_driver: is_driver,
        },
      ],
      {
        onCompleted: () => {
          pushLatest("/");
          sessionStorage.setItem("skipFallback", "true");
          window.location.reload();
        },
        onError: (error) => {
          console.error("Landing page update failed:", error);
        },
      },
    );
  };

  const handleBackClick = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("phone");
    sessionStorage.setItem("skipFallback", "true");
    window.location.reload();
  };

  return (
    <PageLayout
      screenName="LookingForPage"
      showBackButton
      title="Looking for ?"
      backButtonClick={handleBackClick}
    >
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex justify-center px-6 py-6">
          <div className="w-full max-w-md flex-1 flex flex-col gap-8 mb-42">
            <div
              onClick={handleDriverClick}
              className="flex-1 bg-[#FFFCF2] border border-[#F4E7A2] rounded-2xl shadow-sm
                         flex flex-col items-center justify-center cursor-pointer transition-all
                         duration-200 hover:shadow-md active:scale-95 px-4"
            >
              <div className="w-4/5 sm:w-3/4 mx-auto mb-3">
                <IonImg
                  src={steeringIcon}
                  alt="Get a Driver"
                  className="w-full h-auto object-contain"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[#0C1436] text-center">
                Get a Driver
              </h3>
            </div>

            <div
              onClick={handleReadyClick}
              className="flex-1 bg-[#FFFCF2] border border-[#F4E7A2] rounded-2xl shadow-sm
                         flex flex-col items-center justify-center cursor-pointer transition-all
                         duration-200 hover:shadow-md active:scale-95 px-4"
            >
              <div className="w-4/5 sm:w-3/4 mx-auto mb-3">
                <IonImg
                  src={carIcon}
                  alt="Ready to Drive"
                  className="w-full h-auto object-contain"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-[#0C1436] text-center">
                Ready to Drive
              </h3>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default LookingForPage;
