import React, { useContext, useEffect, useState } from "react";
import {
  IonContent,
  IonCard,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonIcon,
  IonButton,
} from "@ionic/react";
import { checkmarkOutline } from "ionicons/icons";
import PageLayout from "../../../common/layout/PageLayout";
import { useLocation } from "react-router";
import useNavigationHistory from "../../../../hooks/useNavigationHistory";
import constants from "../../../../lib/constants";
import axiosInstance from "../../../../api/axiosinstance";
import useApiCall from "../../../../hooks/useApi";
import { endPoints } from "../../../../lib/constants/endpoints";
import { UserContext, UserProvider } from "../../../../provider/UserProvider";



const TripCompletedPage: React.FC = () => {

  const { pushLatest }  = useNavigationHistory();

  const location = useLocation()
  const[paymentPending , setPaymentPending] = useState(false);
  const[driverFare,setDriverFare] = useState();
  const { user } = useContext(UserContext);
      

  const tripId = localStorage.getItem('tripFromHome');

  const[getTripStatus] = useApiCall(axiosInstance.get);

  const[getDriverFare] = useApiCall(axiosInstance.post)
  
  
  const getStatus =()=>{
    getTripStatus([`${constants.GET_DRIVER_TRIP_STATUS}/${tripId}`],{
    onCompleted:(res)=>{
      console.log('response from trip status',res.data.data.status);
      if(res.data.data.status === 'COMPLETED'){
        setPaymentPending(true)
      }
    },
    onError:(err)=>{
      console.log('status error ', err)
    }
   })
  }

  useEffect(() => {
    getStatus();
  }
  ,[tripId])

   const getFare =()=>{
     getDriverFare([`${endPoints.GET_DRIVER_TRIP_FARE}`,{
      driver_id: user.driver_id,
      tripId:tripId
    }],{
      onCompleted:(res)=>{
        console.log('total amount',res.data?.data?.fare_amount);
        console.log(res.data?.DriverAmount);
        if(res.data?.data){
          setDriverFare(res.data?.DriverAmount)
        }
      }
    })
  }

  useEffect(()=>{
    getFare()
  },[tripId])

  const paymentSummaryApi = async()=>{
    await getFare();
    await getStatus();
  }

  const handleDone=()=>{
    pushLatest(constants.HOME_PAGE)
  }
   
  return (
      
    <PageLayout title='Trip Summary' screenName="trip summary" showBackButton  reload refetch={paymentSummaryApi} 
     >
      <IonContent className="ion-padding" 
      style={{
        "overflow" : "hidden",
         "--background": "#F7F7F7",
          "--padding-bottom": "calc(env(safe-area-inset-bottom) + 86px)",
        }}
      >
        { paymentPending  ? (      
      <IonContent className="ion-padding overflow-hidden" style={{ "--background": "#F7F7F7" 
      }}>  
        <div className="flex flex-col items-center mt-10">
          <div
            style={{
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              background: "#22C55E",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <IonIcon
              icon={checkmarkOutline}
              style={{ fontSize: "65px", color: "#fff" }}
            />
          </div>

          <IonText className="ion-text-center">
            <h2
              style={{
                color: "#22C55E",
                marginTop: "16px",
                fontWeight: 600,
                fontSize: "18px",
              }}
            >
              Trip completed successfully
            </h2>
          </IonText>

          <IonText className="ion-text-center">
            <p
              style={{
                fontSize: "14px",
                color: "#707070",
                marginTop: "4px",
                lineHeight: "20px",
              }}
            >
              Your trip amount has been Recorded.
<br /> The Trip Fare Has Been added to your wallet , Thank You 
            </p>
          </IonText>
        </div>

        {/* FARE DETAILS CARD */}
        <IonCard
          style={{
            marginTop: "35px",
            borderRadius: "16px",
            padding: "18px",
            width: "100%",
            maxWidth: "380px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <IonText>
            <h3
              style={{
                fontWeight: 600,
                fontSize: "16px",
                marginBottom: "14px",
                color: "#333",
              }}
            >
              Trip Fare
            </h3>
          </IonText>

          <IonGrid style={{ padding: 0 }}>

            {/* DRIVER CHARGE */}
            <IonRow
              className="ion-align-items-center ion-justify-content-between"
              style={{
                borderBottom: "1px solid #e5e5e5",
                paddingBottom: "10px",
              }}
            >
              <IonCol size="6">
                <IonText style={{ color: "#666", fontSize: "14px" }}>
                  Driver Charge
                </IonText>
              </IonCol>
              <IonCol size="6" className="ion-text-right">
                <IonText style={{ fontWeight: 600 }}>₹ {driverFare}</IonText>
              </IonCol>
            </IonRow>

            {/* TAX */}
            <IonRow
              className="ion-align-items-center ion-justify-content-between"
              style={{
                borderBottom: "1px solid #e5e5e5",
                padding: "10px 0",
              }}
            >
              <IonCol size="6">
                <IonText style={{ color: "#666", fontSize: "14px" }}>
                  TAX
                </IonText>
              </IonCol>
              <IonCol size="6" className="ion-text-right">
                <IonText style={{ fontWeight: 600 }}>0</IonText>
              </IonCol>
            </IonRow>

            {/* TOTAL AMOUNT */}
            <IonRow
              className="ion-align-items-center ion-justify-content-between"
              style={{ paddingTop: "14px" }}
            >
              <IonCol size="6">
                <IonText
                  style={{
                    fontWeight: 600,
                    fontSize: "16px",
                    color: "#333",
                  }}
                >
                  Total Amount
                </IonText>
              </IonCol>
              <IonCol size="6" className="ion-text-right">
                <IonText
                  style={{
                    fontWeight: 700,
                    fontSize: "16px",
                  }}
                >
                  ₹ {driverFare}
                </IonText>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCard>
       <IonButton
  color="myGreen"
  onClick={handleDone}
  className="w-full mt-6 py-3 text-base rounded-xl sm:py-3.5 sm:text-lg md:mt-10"
>
  Done!
</IonButton>
      </IonContent>
)  : 
  <h3 className="text-center">Waiting for the Payment...</h3>

}
</IonContent>
      </PageLayout>
  );
};

export default TripCompletedPage;
