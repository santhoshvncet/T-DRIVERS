import React, { useEffect, useState, useContext } from "react";
import { IonContent, IonGrid, IonSkeletonText } from "@ionic/react";
import { useTranslation } from "react-i18next";
import { UserContext } from "../../../provider/UserProvider";
import axiosInstance from "../../../api/axiosinstance";
import PageLayout from "../../common/layout/PageLayout";
import constants from "../../../lib/constants";
import ProfileInfo from "../../../common/OwnerAccountDetails";
import { useToast } from "../../../hooks/useToast";
import useApiCall from "../../../hooks/useApi";

const OwneraccountDetailsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useContext(UserContext);

  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const[post_status]=useApiCall(axiosInstance.post);
  const[get_status]=useApiCall(axiosInstance.get);
  
  useEffect(() => {
  const fetchUserDetails = async () => {
    try {
      await get_status(
        [
          constants.GET_USER_INITIAL_DATA,
          {params:{ phone: user.phone }},
        ],
        {
          onCompleted: (res: any) => {
            const data = res?.data?.data ? res.data.data : res?.data;
            setDetails(data);
            setLoading(false);
          },
          onError: (_err: any) => {
            setError("Failed to load user details.");
            setLoading(false);
          },
        }
      );
    } catch (err: any) {
      setError("Failed to load user details.");
      setLoading(false);
    }
  };

  if (user?.phone) fetchUserDetails();
}, [user?.phone]);


  const handleSave = async (form: any) => {
  try {
    if (
      !form.name || form.name === "" ||
      !form.email || form.email === "" ||
      !form.address || form.address === ""
    ) {
      setDetails((prev: any) => ({
        ...prev,
        name: form.name,
        email: form.email,
        address: form.address,
      }));
      toast.error("field Valeues not be empty");
    } else {
      await post_status(
        [
          constants.EDIT_OWNER_ACCOUNT_DETAILS,
          {
            name: form.name,
            full_name: form.name,
            email: form.email,
            address: form.address,
            phone: details.phone,
            city_id: details.city_id,
            state: details.state,
          },
        ],
        {
          onCompleted: () => {
            toast.success("Profile updated successfully!");

            setDetails((prev: any) => ({
              ...prev,
              name: form.name,
              email: form.email,
              address: form.address,
            }));
          },
          onError: (err: any) => {
            const msg =
              err?.response?.data?.error ??
              err?.response?.data?.message ??
              err?.message ??
              "Failed to update profile";

            toast.error(msg);
          },
        }
      );
    }
  } catch (err: any) {
    const msg =
      err?.response?.data?.error ??
      err?.response?.data?.message ??
      err?.message ??
      "Failed to update profile";

    toast.error(msg);
  }
};
  const renderSkeleton = () => (
    <IonGrid className="p-4 flex flex-col items-center space-y-6">
      <div className="flex flex-col items-center space-y-3 mt-4">
        <IonSkeletonText
          animated
          style={{ width: "110px", height: "110px", borderRadius: "50%" }}
        />
        <IonSkeletonText
          animated
          style={{ width: "120px", height: "20px", borderRadius: "8px" }}
        />
        <IonSkeletonText
          animated
          style={{ width: "90px", height: "16px", borderRadius: "8px" }}
        />
      </div>

      <div className="flex w-full justify-end pr-4">
        <IonSkeletonText
          animated
          style={{ width: "50px", height: "25px", borderRadius: "6px" }}
        />
      </div>

      <div className="w-full flex flex-col space-y-4 px-2">
        <IonSkeletonText
          animated
          style={{ width: "100%", height: "50px", borderRadius: "12px" }}
        />
        <IonSkeletonText
          animated
          style={{ width: "100%", height: "50px", borderRadius: "12px" }}
        />
        <IonSkeletonText
          animated
          style={{ width: "100%", height: "50px", borderRadius: "12px" }}
        />
      </div>
    </IonGrid>
  );

  if (error)
    return (
      <PageLayout
        title="Account"
        showBackButton
        screenName={constants.ANALYTICS_SCREEN_NAME.OWNER_ACCOUNT_DETAILS_PAGE}
      >
        <IonContent className="text-center text-red-500 mt-10">
          {error}
        </IonContent>
      </PageLayout>
    );

  return (
    <PageLayout
      title={t("Account")}
      showBackButton
      screenName={constants.ANALYTICS_SCREEN_NAME.OWNER_ACCOUNT_DETAILS_PAGE}
    >
      <IonContent className="ion-padding bg-gray-50">
        {loading ? (
          renderSkeleton()
        ) : (
          <IonGrid>
            <ProfileInfo user={user} details={details} onSave={handleSave} />
          </IonGrid>
        )}
      </IonContent>
    </PageLayout>
  );
};

export default OwneraccountDetailsPage;
// screenName={constants.ANALYTICS_SCREEN_NAME.ACCOUNT_DETAILS_PAGE}
