export type FormHelperLabels = string
export type TripStatus =
  | "CREATED"
  | "CONFIRMED"
  | "ONGOING"
  | "COMPLETED"
  | "PAYMENT_PENDING"
  | "PAYMENT_COMPLETED"
  | "ACCEPTED"
  | "TRIP_STARTED"
  | "OTP_VERIFIED"
  | "TRIP_STARTED"
  | "START_TRIP_CAR_PHOTOS"
  | "TRIP_ENDED"
  | "END_TRIP_CAR_PHOTOS"
  ;
interface ITrip {
  from?: string;
  id?: number;  
  status?: TripStatus;  
  to?: string;
  fromCity?: string; 
  toCity?: string;  
  startDate?: string;
  endDate?: string;
  pickupTime?: string;
  dropTime?: string;
  fare_amount?: number;
  origin_latitude?: number;
  origin_longitude?: number;
  dest_latitude?: number;
  dest_longitude?: number;
   trip_type?: string;
   driver_allowance?: number | null;
   

 
}
interface IDriver {
  name: string;
  phone: string;
  profileUrl?: string; // optional if not always returned
}

