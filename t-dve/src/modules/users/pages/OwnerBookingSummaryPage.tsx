// import React, { useEffect, useState } from "react";
// import { IonButton, IonContent, IonModal, IonSpinner } from "@ionic/react";
// import { useParams } from "react-router";
// import PageLayout from "../../common/layout/PageLayout";
// import TripMap from "../../../common/TripMap";
// import TripCard from "../../../common/TripCard";
// import DriverCard from "../../../common/DriverCard";
// import { useToast } from "../../../hooks/useToast";
// import axiosInstance from "../../../api/axiosinstance";
// import { useLocation } from "react-router-dom";
// import { useIonRouter } from "@ionic/react";


// const BookingSummaryPage: React.FC = 
// () => {
//   const toast = useToast();
//   const location = useLocation();
// const router = useIonRouter();

//   const queryParams = new URLSearchParams(location.search);
//   const trip_id = queryParams.get("trip_id");
//   const driver_id = queryParams.get("driver_id");

//     console.log("here is the trip id and driver id", trip_id, driver_id)

//   const [trip, setTrip] = useState<any>(null);
//   const [driver, setDriver] = useState<any>(null);
//   const [origin, setOrigin] = useState({ lat: 0, lng: 0 });
//   const [destination, setDestination] = useState({ lat: 0, lng: 0 });
//   const [modalOpen, setModalOpen] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [fare, setFare] = useState<number | null>(null);
  
// const [isBooking, setIsBooking] = useState(false);



//   useEffect(() => {
//     loadTripDetails();
//   }, [trip_id]);


// useEffect(() => {
//     if (location.pathname !== "/booking-summary") { 
//       setModalOpen(false);
//     }else{
//       setModalOpen(true);
//     }
//   }, [location.pathname]);


//   const loadTripDetails = async () => {
//     try {
//       const res =await axiosInstance.get(`users/tripdetails/tripId/${trip_id}`);
// console.log("Trip fetched from API:", res.data.trip);
// console.log("Trip ID from URL:", trip_id);
//       if (!res.data.status) {
//         toast.error("No trip found.");
//         return;
//       }

//       setTrip(res.data.trip);


//       setOrigin({
//         lat: Number(res.data.trip.origin_latitude),
//         lng: Number(res.data.trip.origin_longitude),
//       });

//       setDestination({
//         lat: Number(res.data.trip.dest_latitude),
//         lng: Number(res.data.trip.dest_longitude),
//       });

//       if (res.data.driver) setDriver(res.data.driver);

//       setModalOpen(true);
//     } catch (error) {
//       console.log(error);
//       toast.error("Server error while fetching trip");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBooking = () => {
//     toast.success("Booking confirmed!", 2000);
//   };
// useEffect(() => {
//   const storedFare = sessionStorage.getItem("fare_amount");
//   if (storedFare) setFare(Number(storedFare));
// }, [trip_id]);


//   if (loading) {
//     return (
//       <PageLayout showBackButton title="Booking Summary" screenName="Booking">
//         <IonContent className="flex justify-center items-center h-full">
//           <IonSpinner name="crescent" />
//         </IonContent>
//       </PageLayout>
//     );
//   }

//   if (!trip) {
//     return (
//       <PageLayout showBackButton title="Booking Summary" screenName="Booking">
//         <IonContent className="ion-padding">Trip not found</IonContent>
//       </PageLayout>
//     );
//   }

//   return (
//     <PageLayout
//       title="Booking Summary"
//       screenName="Booking Summary"
//       showBackButton
//     >
//       <IonContent style={{ paddingBottom: 100 }}>
//         {origin.lat !== 0 && (
//           <div style={{ height: "300px" }}>
//             <TripMap
//               origin={origin}
//               destination={destination}
//               isModalOpen={modalOpen}
//             />
//           </div>
//         )}

//         <IonModal
//           isOpen={modalOpen}
//           className="rounded-t-xl mb-25"
//           onDidDismiss={() => setModalOpen(false)}
//           initialBreakpoint={0.6}
//           breakpoints={[0, 0.6, 0.8]}
//         >
//           <div className="p-4">
//             <p className="font-semibold mb-2">About Trip</p>
//             <TripCard
//               trip={{
//                 ...trip,
//                 fromCity: trip.origin_name,
//                 toCity: trip.dest_name,
//               }}
//               editable={false}
//             />


//             {driver && (
//               <>
//                 <p className="font-semibold mt-4 mb-2">Driver</p>
//                 <DriverCard
//                   name={driver.name}
//                   phone={driver.phone}
//                   languages={driver.languages}
//                   avatarUrl={driver.profileUrl}
//                 />
//               </>
//             )}
//           </div>
//         </IonModal>

//   <div className="fixed bottom-0 left-0 right-0 h-[72px] px-4 flex items-center justify-between bg-[#111] rounded-t-[24px] shadow-[0_-4px_12px_rgba(0,0,0,0.2)]">
//   <p className="text-white text-lg ">
//     ₹ {fare !== null ? fare.toLocaleString("en-IN") : "0"}
//   </p>

// <IonButton
//   expand="block"
//   className="h-14 w-[130px] rounded-xl font-semibold"
//   style={{
//     "--background": "#FFD700",
//     "--color": "#000",
//   }}
//   disabled={isBooking}
//   onClick={() => {
//     if (isBooking) return;

//     setIsBooking(true);

//     router.push(
//       `/payment-details?trip_id=${trip_id}&driver_id=${driver_id}&fare=${fare}`,
//       "forward"
//     );
//   }}
// >
//   {isBooking ? (
//     <IonSpinner name="crescent" />
//   ) : (
//     "Book Now"
//   )}
// </IonButton>
// </div>

//       </IonContent>
//     </PageLayout>
//   );
// };

// export default BookingSummaryPage;
