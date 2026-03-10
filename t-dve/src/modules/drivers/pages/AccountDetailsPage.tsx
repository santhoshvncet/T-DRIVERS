import React, { useEffect, useState, useContext } from "react";
import { IonContent, IonSpinner, IonCard, IonCardContent } from "@ionic/react";

import { useTranslation } from "react-i18next";
import { UserContext } from "../../../provider/UserProvider";
import axiosInstance from "../../../api/axiosinstance";
import PageLayout from "../../common/layout/PageLayout";
import constants from "../../../lib/constants";
import AccountDetailsContent from "../../../common/DriverAccountDetails";
import DriverAccountSkeleton from "../../../common/driverAccountskeletonloader";
import { useToast } from "../../../hooks/useToast";
import useApiCall from "../../../hooks/useApi";

const AccountDetailsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useContext(UserContext);

  const [details, setDetails] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const[getuserinitialdata]=useApiCall(axiosInstance.get);
  const[getdriverregdetails]=useApiCall(axiosInstance.get);

useEffect(() => {
  const fetchUserData = async () => {
    try {
      const response: any = await new Promise((resolve, reject) => {
        getuserinitialdata(
          [
            constants.GET_USER_INITIAL_DATA,
            {params:{ phone: user.phone }},
          ],
          {
            onCompleted: (res: any) => resolve(res),
            onError: (err: any) => reject(err),
          }
        );
      });

      const data = response?.data?.data || response?.data;

      setDetails((prev: any) => ({
        ...prev,
        ...data,
      }));
    } catch (err) {
      console.log("Error fetching user data", err);
    }
  };

  fetchUserData();
}, []);


useEffect(() => {
  const fetchDriverData = async () => {
    try {
      const response: any = await new Promise((resolve, reject) => {
        getdriverregdetails(
          [
            `${constants.GET_DRIVER_REG_DETAILS}/${user.userId}`,
          ],
          {
            onCompleted: (res: any) => resolve(res),
            onError: (err: any) => reject(err),
          }
        );
      });

      const driver = response?.data?.driver;

      setDetails((prev: any) => ({
        ...prev,
        ...driver,
        transmission: driver.transmission,
        board_type: driver.board_type,
        driving_license_url: driver.driving_license_url,
        profile_photo_url: driver.profile_photo_url,
        languages: driver.languages,
      }));
    } catch (err) {
      setError("Failed to load driver details.");
    } finally {
      setLoading(false);
    }
  };

  fetchDriverData();
}, []);

  const handleSave = async (form: any) => {
    try {
      if(!form.name || form.name === '' || !form.email || form.email === ''|| !form.address || form.address === '' || !form.transmission || form.transmission === '' || !form.boardType || form.boardType === '' || !form.licensePreview || form.licensePreview === ""){

        setDetails((prev: any) => ({
          ...prev,
          name: form.name,
          email: form.email,
          address: form.address,
          transmission: form.transmission,
          board_type: form.boardType,
          driving_license_url: form.licensePreview || prev.driving_license_url,
        }));
      }else{

      const fd = new FormData();

      fd.append("userId", String(user.userId));
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("address", form.address);
      fd.append("transmission", form.transmission);
      fd.append("boardType", form.boardType);
      fd.append("languages", JSON.stringify(form.languages));

      if (form.licenseFile) {
        fd.append("licenseFile", form.licenseFile);
      }

      const res = await axiosInstance.post(
        constants.EDIT_DRIVER_ACCOUNT_DETAILS,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Because backend now returns 200 only on success
      if (!res.data.status) {
        toast.error(res.data.error);
        return;
      }

      toast.success("Profile updated successfully!");
      // window.location.reload();

      setDetails((prev: any) => ({
        ...prev,
        name: form.name,
        email: form.email,
        address: form.address,
        transmission: form.transmission,
        board_type: form.boardType,
        driving_license_url: form.licensePreview || prev.driving_license_url,
        languages: form.languages,
      }));
      }
    } catch (err: any) {
      // console.log("ERROR ===>", err);

      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        "Failed to update profile";
      // console.log("here is the message", msg)
      toast.error(msg);
      // window.location.reload();
    }
  };

  if (loading)
    return (
      <PageLayout
        title="Account"
        showBackButton
        screenName={constants.ANALYTICS_SCREEN_NAME.ACCOUNT_DETAILS_PAGE}
      >
        <IonContent className="flex justify-center items-center h-64">
          <IonSpinner name="crescent" />
          <DriverAccountSkeleton />
        </IonContent>
      </PageLayout>
    );

  // ------------ ERROR UI ------------
  // if (error)
  //   return (
  //     <PageLayout
  //       title="Account"
  //       showBackButton
  //       screenName={constants.ANALYTICS_SCREEN_NAME.ACCOUNT_DETAILS_PAGE}
  //     >
  //       <IonContent className="text-center text-red-500 mt-10">
  //         {error}
  //       </IonContent>
  //     </PageLayout>
  //   );

  return (
    <PageLayout
      title={t("Account")}
      showBackButton
      screenName={constants.ANALYTICS_SCREEN_NAME.ACCOUNT_DETAILS_PAGE}
    >
      <IonContent className="ion-padding bg-gray-50">
        <AccountDetailsContent
          details={details}
          user={user}
          onSave={handleSave}
        />
      </IonContent>
    </PageLayout>
  );
};

export default AccountDetailsPage;