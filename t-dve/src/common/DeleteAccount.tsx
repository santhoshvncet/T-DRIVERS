import {
  IonButton,
  IonText,
  IonAlert,

} from "@ionic/react";
import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";

import useApiCall from "../hooks/useApi";
import { UserContext } from "../provider/UserProvider";
import constants from "../lib/constants";
import { useToast } from "../hooks/useToast";
import PageLayout from "../modules/common/layout/PageLayout";
import axiosInstance from "../api/axiosinstance";

const DeleteAccount = () => {
  const { t } = useTranslation();
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [get_status] = useApiCall(axiosInstance.post);
    const { user } = useContext(UserContext);
  const toast = useToast()
  const handleDeleteAccount = async () => {    
    await get_status(
      [constants.DELETE_USER_ACCOUNT, { userId: user.userId  }],
      {
        onCompleted: () => {
          toast.success("Account deleted successfully");
          localStorage.clear();
          window.location.reload()


        },
        onError: () => toast.error("Failed to delete account"),
      }
    );
  };

  return (
<PageLayout title={t("deleteAccountTitle")} screenName="DeleteAccount" showBackButton ionPadding>
  <div style={{ display: 'flex', flexDirection: 'column', height: '84%' }}>
    <div style={{ flex: 1 }}>
      <IonText style={{ color: '#E7A816' }}>
        <h2>{t("deleteAccountWarningTitle")}</h2>
      </IonText>

      <p>{t("deleteAccountMessage")}</p>
    </div>

   
<IonButton
  expand="block"                 
  fill="solid"                    
  color="primary"                 
  size="large"                     
  onClick={() => setShowConfirmAlert(true)}
  style={{
    '--border-radius': '8px',     
    '--padding-top': '12px',      
    '--padding-bottom': '12px',
    '--padding-start': '16px',    
    '--padding-end': '16px',
    fontSize: '20px',             
    fontWeight: 500,              
    width: '100%',              
  }}
>
  {t("confirmDelete")}
</IonButton>


  </div>

  <IonAlert
    isOpen={showConfirmAlert}
    onDidDismiss={() => setShowConfirmAlert(false)}
    header={t("deleteConfirmHeader")}
    message={t("deleteConfirmMessage")}
    buttons={[
      {
        text: t("cancel"),
        role: "cancel",
        handler: () => setShowConfirmAlert(false),
      },
      {
        text: t("yesDelete"),
        role: "destructive",
        handler: handleDeleteAccount,
      },
    ]}
  />
</PageLayout>

  );
};

export default DeleteAccount;
