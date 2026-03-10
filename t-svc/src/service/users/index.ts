import { Router, Request, Response } from "express";
import { getUserProfile } from "./actions/getUserProfile";
import { landingPage } from "./actions/landingPage";
import { getCity } from "./actions/getCity";
import { getCarModels } from "./actions/car_model";
import insertCarDetails from "./actions/insertCarDetails";
import dotenv from "dotenv";
import registerUser from "./actions/insertUserDetails";
dotenv.config();
import { createTrip } from "./actions/CreateTrip";
import { getCarImages } from "./actions/getcarimage";
import multer from "multer";
import { getCarsByUser } from "./actions/getCarDetails";
import { updateCarDetails } from "./actions/updateCarDetails";
import { deleteCarDetails } from "./actions/deleteCarDetails";
import { getInterestedDrivers } from "./actions/getInterestedDrivers";
import { confirmDriver } from "./actions/ConfirmDriver";
import { getTripStatusByOwner } from "./actions/getTrip_status";
import getPaymentHistoryByOwner from "./actions/getPaymentHistory";
import { confirmTrip } from "./actions/ConfirmTrip";
import updateUserProfileImage from "./actions/user_profile_image";
import getOtp from "./actions/getOtp";
import { updateOwnerProfile } from "./actions/ownerAccountdetailsEdit";
import { setPrimaryCar } from "./actions/setPrimaryCar";
import { getNearByDriver } from "./actions/nearByDrivers";
import { calculateFareAmount } from "./actions/Calculatefareamount";
import { calculateDistanceKm } from "./actions/calculateDistance";
import { getDriverArrivalInfo } from "./actions/DriverETA";
import { createTwoWayTrip } from "./actions/TwoWayTrip";
import { verifyPayment } from "./payments/verifyPayment";
import { updateDriverLiveLocation } from "./actions/updateDriveLocTrip";
import { endTrip } from "./actions/endTrip";
import { deleteAccountByRole } from "./actions/deleteAccount";
import { generateAndUploadFarePdf } from "./actions/generatePaymentPdf";
import { getUserNotifications, markAllNotificationsAsRead } from "./actions/notification";
import { pool } from "../db";
import { driverPayouts } from "./payments/driverPayouts";
import { companyCommission } from "./payments/companyComission";
import { transactionsCompany } from "./payments/transactionsCompany";
import getOwnerActiveTripId from "./actions/getOwnerActiveTrip";
import { errorPayload, sendResponse } from "../../utils/response";
import { STATUS_KEYS } from "../../utils/httpStatusCodes";
import getTripId from "./actions/gettripID";
import getTripdetailsByOwner from "./actions/getTripdetails";
import { createPaymentOrder } from "./payments/creatPaymentOrder";
import { updateTripComplete } from "./actions/updateTripComplete";
import { razorpayWebhook } from "./payments/payment_webhooks/razorpayWebhook";

const router = Router();

router.get("/profile", async (req, res) => {
  const { phone, email } = req.query;

  console.log("users--", phone);
  
  try {
    const response = await getUserProfile(phone as any, email as any);
    return sendResponse(res, STATUS_KEYS.OK, { data: response, req });
  } catch (error) {
    console.error("Error in /users/profile:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.post("/register_user", async (req, res) => {
  try {
    const data = await registerUser(req.body);

    if (!data.status) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: errorPayload(data.error)
      });
    }

    return sendResponse(res, STATUS_KEYS.OK, { data: data, req, 
      message: "User + Owner saved successfully",
     });


  } catch (error: any) {
     return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.get("/car_model_suggestions", async (req, res) => {
  const { query } = req.query;
  console.log({ query });

  // Validate input
  if (!query || typeof query !== "string") {
    return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "Query is required"
      });
  }

  console.log("After query");

  try {
    const results = await getCarModels(query);
    return sendResponse(res, STATUS_KEYS.OK, { data: results, req });
  } catch (error) {
    console.log("Error fetching car model suggestions ------------", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});
const upload = multer({ storage: multer.memoryStorage() });
router.post("/register_car",
  async (req: any, res: any) => {
    try {
      const carData = {
        ...req.body,
        user_id: req.body.user_id,
      };

      console.log("Incoming car data:", carData);

      const response = await insertCarDetails(carData);

      return sendResponse(res, STATUS_KEYS.OK, { data: response.car, req, message: "Car added successfully!" });

    } catch (error: any) {
      console.error("Error in /register_car:", error.message);

      return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
    }
  }
);

router.get("/user/:user_id", async (req, res) => {
  try {
    const user_id = Number(req.params.user_id);

    const cars = await getCarsByUser(user_id);

    return sendResponse(res, STATUS_KEYS.OK, { data: cars, req });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});

router.get("/announcement/:user_id", async (req, res) => {
  try {
    const user_id = Number(req.params.user_id);
    const role = String(req.query.role || "");
    console.log({ user_id, role });
    

    if (!user_id || !role) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: { message: "user_id and role are required" }
      });
    }

    const notifications = await getUserNotifications(user_id, role);
    return sendResponse(res, STATUS_KEYS.OK, { data: notifications, req });

  } catch (error: any) {
    console.error("Error fetching notifications:", error);

    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.post("/announcement/:user_id/read-all", async (req, res) => {
  try {
    const user_id = Number(req.params.user_id);
    const role = String(req.query.role || "");

    if (!user_id || !role) {
     return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: { message: "user_id and role are required" }
      });
    }

    await markAllNotificationsAsRead(user_id, role);

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error marking notifications as read:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

// Backend (Express)
router.put("/car/:car_id", async (req, res) => {
  try {
    const car_id = Number(req.params.car_id); // Get car_id from URL parameter
    const response = await setPrimaryCar(car_id); // Call the function to update the primary car
    return sendResponse(res, STATUS_KEYS.OK, { data: response, req });

  } catch (err: any) {
    console.error("Error setting car as primary:", err); // Log the error
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});

router.put("/update_car/:car_id",
  upload.fields([
    { name: "photo_front", maxCount: 1 },
    { name: "photo_left", maxCount: 1 },
    { name: "photo_back", maxCount: 1 },
    { name: "photo_right", maxCount: 1 },
    { name: "car_insurance", maxCount: 1 },
    { name: "rc_card", maxCount: 1 },
  ]),
  async (req: any, res: any) => {
    try {
      const car_id = Number(req.params.car_id);

      const updateData = {
        ...req.body,

        photo_front: req.files?.photo_front?.[0] || null,
        photo_left: req.files?.photo_left?.[0] || null,
        photo_back: req.files?.photo_back?.[0] || null,
        photo_right: req.files?.photo_right?.[0] || null,

        car_insurance: req.files?.car_insurance?.[0] || null,
        rc_card: req.files?.rc_card?.[0] || null,
      };

      console.log("Incoming UPDATE data:", updateData);

      const updatedCar = await updateCarDetails(car_id, updateData);

      return sendResponse(res, STATUS_KEYS.OK, { data: updatedCar, req, message: "Car updated successfully!", });
    } catch (error: any) {
      console.error("Error in /update_car:", error.message);

      return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
        error: errorPayload(error),
      });
    }
  }
);


router.post("/update_landing_page", async (req: any, res: any) => {
  const userData = req.body;
  const { landing_page, user_id } = userData;

  try {
    const response = await landingPage(landing_page, user_id);
    return sendResponse(res, STATUS_KEYS.OK, { data: response, req });
  } catch (error) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.get("/city_suggestions", async (req, res) => {
  try {
    const query = req.query.query as string;
    const latitude = req.query.latitude ? Number(req.query.latitude) : undefined;
    const longitude = req.query.longitude ? Number(req.query.longitude) : undefined;

    const data = await getCity({
      query,
      latitude,
      longitude,
    });

    return sendResponse(res, STATUS_KEYS.OK, { data: data, req });

  } catch (error) {
    console.error("City suggestion error:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});


router.delete("/delete_car/:carId", async (req, res) => {
  try {
    const carId = Number(req.params.carId);

    const deleted = await deleteCarDetails(carId);

    return sendResponse(res, STATUS_KEYS.OK, { data: deleted, req, message: "Car deleted successfully", });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});


router.get("/car_image", async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = req.query.owner_id;

    if (!ownerId || Array.isArray(ownerId)) {
      sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: { message: "Owner ID is required"}
      });
    }

    const owner_id = Number(ownerId);
    if (isNaN(owner_id)) {
      sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: errorPayload({ message: "Owner ID must be a number" })
      });
    }

    const car_image = await getCarImages(owner_id);

    sendResponse(res, STATUS_KEYS.OK, { data: car_image, req });
  } catch (error) {
    sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.get("/interested-drivers", async (req: Request, res: Response) => {
  try {
    const { trip_id } = req.query;

    if (!trip_id || Array.isArray(trip_id)) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: errorPayload({ message: "trip_id is required" }),
      });
    }

    if (isNaN(Number(trip_id))) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: errorPayload({ message: "trip_id must be a number" }),
      });
    }

    const result = await getInterestedDrivers(Number(trip_id));

      return sendResponse(res, STATUS_KEYS.FETCH_OK, {
      data: {
        count: result.rowCount,
        rows: result.rows,
      },
    });


  } catch (error) {
    console.error("Error:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});



router.post("/get_otp", async (req, res) => {
  const { owner_id } = req.body;

  if (!owner_id) {
    return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: errorPayload({ msg: "owner_id is required" })
      });
  }

  try {
    const response = await getOtp(owner_id);
    console.log("here is the otp", response);
    return sendResponse(res, STATUS_KEYS.OK, { ...response, req });

  } catch (err) {
    console.error("Error in /get_otp:", err);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});




router.post(
  "/upload_profile_image",
  upload.single("profile_image"),
  async (req, res) => {
    try {
      const user_id = Number(req.body.user_id);

      const result = await updateUserProfileImage(user_id, req.file || null);

      return sendResponse(res, STATUS_KEYS.OK, { data: result, req });

    } catch (err: any) {
      console.error("Profile image route error:", err);
      return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
    }
  }
);

router.post("/users/update_profile", async (req, res) => {
  try {
    const result = await updateOwnerProfile(req.body);

    // If service returns error, send HTTP 400
    if (!result.status) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: errorPayload(result.error)
      });
    }

    //Success
    return sendResponse(res, STATUS_KEYS.OK, { data: result.data, req, message: result.message });

  } catch (err:any) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});

router.get("/tripdetails/tripId/:ownerId", async (req, res) => {
  try {
    const result = await getTripId(req.params.ownerId);

    if (!result.status) {
      return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
        error: errorPayload(result),
      });
    }

    // Spread driver and trip out of data to top-level in response
    return sendResponse(res, STATUS_KEYS.OK, { ...result.data, req });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});


router.get("/trip/driver-arrival-info/:tripId", async (req, res) => {
  try {
    const result = await getDriverArrivalInfo(req.params.tripId);

    if (!result.status) {
      return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
        error: errorPayload(result.error ?? result),
      });
    }

    // Keep same sample style: spread data
    return sendResponse(res, STATUS_KEYS.OK, { ...result.data, req });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});

router.post("/create_two_way_trip", async (req, res) => {
  try {
    const result = await createTwoWayTrip(req.body);

    if (!result.status) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: errorPayload(result.msg),
      });
    }

    // return 200 so your hook definitely calls onCompleted
    return sendResponse(res, STATUS_KEYS.FETCH_OK, {
      data: result.data,
      message: result.msg,
      req,
    });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});

router.post("/update-driver-live-location/:tripId", async (req, res) => {
  try {
    const result = await updateDriverLiveLocation(req.params.tripId, req.body);

    if (!result.status) {
      // pick status key based on msg (optional)
      const msg = (result.msg || "").toLowerCase();
      const key =
        msg.includes("required") || msg.includes("invalid")
          ? STATUS_KEYS.BAD_REQUEST
          : msg.includes("not found")
          ? STATUS_KEYS.NOT_FOUND
          : STATUS_KEYS.INTERNAL_SERVER_ERROR;

      return sendResponse(res, key, {
        error: errorPayload(result.error ?? { message: result.msg }),
      });
    }

    // IMPORTANT: return 200 (not 201) to avoid frontend hook issue
    return sendResponse(res, STATUS_KEYS.FETCH_OK, {
      message: result.msg, // keeps same message text
      req,
    });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});

router.post("/create_trip", async (req, res) => {
  try {
    const result = await createTrip(req.body);

    if (!result.status) {
      const key =
        result.errorKey === "BAD_REQUEST"
          ? STATUS_KEYS.BAD_REQUEST
          : result.errorKey === "NOT_FOUND"
          ? STATUS_KEYS.NOT_FOUND
          : result.errorKey === "CONFLICT"
          ? STATUS_KEYS.BAD_REQUEST // since you don't have CONFLICT key; else add it
          : STATUS_KEYS.INTERNAL_SERVER_ERROR;

      return sendResponse(res, key, {
        error: errorPayload(result.msg),
      });
    }

    // Use 200 so frontend hooks don't fail on 201
    return sendResponse(res, STATUS_KEYS.FETCH_OK, {
      data: result.data,
      message: result.msg,
      scheduled_at_ist: result.scheduled_at_ist,
      created_at_ist: result.created_at_ist,
      start_date: result.start_date,
      end_date: result.end_date,
      debug: result.debug,
      req,
    });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});

router.get("/tripdetails/owner/:ownerId", async (req, res) => {
  try {
    const result = await getTripdetailsByOwner(req.params.ownerId);

    if (!result.status) {
      // you were using 404 earlier; if you want 404 specifically:
      const key =
        result.msg === "No active trip found for this owner"
          ? STATUS_KEYS.NOT_FOUND
          : result.msg === "Invalid ownerId"
          ? STATUS_KEYS.BAD_REQUEST
          : STATUS_KEYS.INTERNAL_SERVER_ERROR;

      return sendResponse(res, key, {
        error: errorPayload(result.error ?? { message: result.msg }),
      });
    }

    // Keep trip + driver at top-level (same as old response)
    return sendResponse(res, STATUS_KEYS.OK, { ...result.data, req });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});

router.get("/getOwnerActiveTrip/:ownerId", async (req, res) => {
  try {
    const result = await getOwnerActiveTripId(req.params.ownerId);

    if (!result.status) {
      // old code used 400 when ownerId missing
      const key =
        result.msg === "Owner Id required!"
          ? STATUS_KEYS.BAD_REQUEST
          : STATUS_KEYS.INTERNAL_SERVER_ERROR;

      return sendResponse(res, key, {
        error: errorPayload(result.error ?? { message: result.msg }),
      });
    }

    // IMPORTANT: keep trip_id at top-level like old response
    return sendResponse(res, STATUS_KEYS.OK, { ...result.data, req });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});

router.get("/trip/payments/:ownerId", async (req, res) => {
  try {
    const result = await getPaymentHistoryByOwner(req.params.ownerId);

    if (!result.status) {
      const key =
        result.msg === "Invalid ownerId"
          ? STATUS_KEYS.BAD_REQUEST
          : STATUS_KEYS.INTERNAL_SERVER_ERROR;

      return sendResponse(res, key, {
        error: errorPayload(result.error ?? { message: result.msg }),
      });
    }

    // IMPORTANT: keep payment_status & payments at top-level (like old response)
    return sendResponse(res, STATUS_KEYS.OK, { ...result.data, req });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});

router.post("/confirm_driver", async (req, res) => {
  try {
    const { trip_id, driver_id , ownerId } = req.body;


    const ongoingTrip = await getOwnerActiveTripId(ownerId);
    
    console.log('ongoing trip details result ', ongoingTrip);
    
    if(ongoingTrip.status) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: errorPayload({ message: "Finish the current ongoing Trip" }),
      });
    }

    const result = await confirmDriver(trip_id, driver_id);

    if (!result.status) {
      // map errors to correct status key
      const key =
        result.msg === "trip_id and driver_id are required"
          ? STATUS_KEYS.BAD_REQUEST
          : result.msg === "Driver not found"
          ? STATUS_KEYS.NOT_FOUND
          : result.msg === "Driver is busy"
          ? STATUS_KEYS.BAD_REQUEST // you used 409 earlier; add CONFLICT if you want exact
          : STATUS_KEYS.INTERNAL_SERVER_ERROR;

      return sendResponse(res, key, {
        // keep legacy field too (non-breaking for clients using `success`)
        success: false,
        error: errorPayload(result.error ?? { message: result.msg }),
      });
    }

    // success (use 200 to avoid frontend hook issue with 201)
    return sendResponse(res, STATUS_KEYS.FETCH_OK, {
      success: true,          // keep legacy `success`
      message: result.msg,    // same text
      data: result.data,      // { trip, driver }
      req,
    });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      success: false,
      error: errorPayload(err),
    });
  }
});

router.get("/tripdetails/by-status/:ownerId", async (req, res) => {
  try {
    const result = await getTripStatusByOwner(req.params.ownerId);

    if (!result.status) {
      const key =
        result.msg === "ownerId is required"
          ? STATUS_KEYS.BAD_REQUEST
          : STATUS_KEYS.INTERNAL_SERVER_ERROR;

      return sendResponse(res, key, {
        error: errorPayload(result.error ?? { message: result.msg }),
      });
    }

    // keep `data` key same as old response (frontend uses res.data.data)
    return sendResponse(res, STATUS_KEYS.OK, { data: result.data, req });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});

router.post("/confirm-trip", async (req, res) => {
  try {
    const result = await confirmTrip(req.body.trip_id);

    if (!result.status) {
      const key =
        result.msg === "trip_id is required"
          ? STATUS_KEYS.BAD_REQUEST
          : result.msg === "Trip not found"
          ? STATUS_KEYS.NOT_FOUND
          : STATUS_KEYS.INTERNAL_SERVER_ERROR;

      return sendResponse(res, key, {
        error: errorPayload(result.error ?? { message: result.msg }),
      });
    }

    // return 200 (avoid 201 issues)
    return sendResponse(res, STATUS_KEYS.FETCH_OK, {
      message: result.msg, // "Trip confirmed successfully"
      req,
    });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});

router.get("/search-nearby/:cityId", async (req, res) => {
  try {
    const result = await getNearByDriver(req.params.cityId);

    if (!result.status) {
      const key =
        result.msg === "city_id is required"
          ? STATUS_KEYS.BAD_REQUEST
          : result.msg === "City not found"
          ? STATUS_KEYS.NOT_FOUND
          : STATUS_KEYS.INTERNAL_SERVER_ERROR;

      return sendResponse(res, key, {
        // keep legacy `success` key also (so frontend expecting success won't break)
        success: false,
        error: errorPayload(result.error ?? { message: result.msg }),
      });
    }

    // keep old response fields: success/source_city/count/data at top-level
    return sendResponse(res, STATUS_KEYS.OK, {
      success: true,
      ...result.data,
      req,
    });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      success: false,
      error: errorPayload(err),
    });
  }
});

router.post("/create-payment-order", async (req, res) => {
  try {
    const result = await createPaymentOrder(req.body);

    if (!result.status) {
      const key =
        result.msg === "amount and trip_id are required"
          ? STATUS_KEYS.BAD_REQUEST
          : STATUS_KEYS.INTERNAL_SERVER_ERROR;

      return sendResponse(res, key, {
        success: false, // keep legacy key
        error: errorPayload(result.msg),
      });
    }

    // If your frontend hook fails on 201, use FETCH_OK (200). Otherwise use POST (201).
    return sendResponse(res, STATUS_KEYS.POST, {
      success: true, // keep legacy key
      message: result.msg,
      ...result.data, // payment_order_id, razorpay_order at top-level (like old response)
      req,
    });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      success: false,
      error: errorPayload(err),
    });
  }
});

router.post("/verify-payment", async (req, res) => {
  try {
    const result = await verifyPayment(req.body);

    if (!result.status) {
      const key =
        result.errorKey === "BAD_REQUEST"
          ? STATUS_KEYS.BAD_REQUEST
          : result.errorKey === "NOT_FOUND"
          ? STATUS_KEYS.NOT_FOUND
          : STATUS_KEYS.INTERNAL_SERVER_ERROR;

      // keep legacy top-level `status` string when possible (failed)
      // BUT sendResponse error puts details under `error`
      return sendResponse(res, key, {
        // optional legacy-friendly fields:
        statusText: "failed",
        error: errorPayload(result.error ?? { message: result.msg }),
      });
    }

    // success: keep payment response keys at top-level
    // result.data includes: { status: "success"|"pending", payment? }
    return sendResponse(res, STATUS_KEYS.FETCH_OK, {
      message: result.msg,
      ...result.data,
      req,
    });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});

router.get("/company-comission", async (req, res) => {
  try {
    const result = await companyCommission();

    // RAW => preserves exact old JSON body (status: "success"/"failed")
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: result.httpStatus, body: result.body, type: "json" },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { status: "failed", message: err.message || "Internal Server Error" },
        type: "json",
      },
    });
  }
});

router.post("/driver-payouts", async (req, res) => {
  try {
    const result = await driverPayouts(req.body);

    // RAW passthrough => preserves exact response (status: "success"/"failed")
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: result.httpStatus, body: result.body, type: "json" },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { status: "failed", message: err.message || "Internal Server Error" },
        type: "json",
      },
    });
  }
});

router.get("/company-transactions", async (req, res) => {
  try {
    const result = await transactionsCompany();

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: result.httpStatus, body: result.body, type: "json" },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { status: "failed", message: err.message || "Internal Server Error" },
        type: "json",
      },
    });
  }
});

router.post("/razorpay-webhook", async (req, res) => {
  try {
    console.log("razorpay webhook api called");

    // ACK immediately (non-breaking)
    res.status(200).send("OK");

    // Then process async (do not await)
    razorpayWebhook(req);
  } catch (err) {
    // Even on error, Razorpay expects 200 for ACK in most setups.
    // But if you want to signal failure, change statusCode accordingly.
console.log("Error in webhook",err)
  }
});

router.put("/trip-complete", async (req, res) => {
  try {
    const result = await updateTripComplete(req.body.trip_id);

    if (!result.status) {
      const key =
        result.msg === "trip_id is required"
          ? STATUS_KEYS.BAD_REQUEST
          : result.msg?.toLowerCase().includes("not found")
          ? STATUS_KEYS.NOT_FOUND
          : STATUS_KEYS.INTERNAL_SERVER_ERROR;

      return sendResponse(res, key, {
        // keep legacy key for frontend
        success: false,
        error: errorPayload(result.error ?? { message: result.msg }),
      });
    }

    // success: use 200 to avoid 201 issues
    return sendResponse(res, STATUS_KEYS.FETCH_OK, {
      success: true,
      message: result.msg,
      data: result.data, // returning updated row
      req,
    });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      success: false,
      error: errorPayload(err),
    });
  }
});

router.post("/trip/end", async (req, res) => {
  try {
    const result = await endTrip(req.body.trip_id);

    if (!result.status) {
      const key =
        result.errorKey === "BAD_REQUEST"
          ? STATUS_KEYS.BAD_REQUEST
          : result.errorKey === "NOT_FOUND"
          ? STATUS_KEYS.NOT_FOUND
          : STATUS_KEYS.INTERNAL_SERVER_ERROR;

      return sendResponse(res, key, {
        // keep same "message" wording via errorPayload object
        error: errorPayload(result.error ?? { message: result.msg }),
      });
    }

    return sendResponse(res, STATUS_KEYS.OK, {
      data: result.data,
      message: result.msg,
      req,
    });
  } catch (err) {
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(err),
    });
  }
});

router.post("/calculate-fare", async (req, res) => {
  try {
    const { start_date, end_date, pickup_time, drop_time, origin_id, dest_id } = req.body;

    if (!start_date || !end_date || !pickup_time || !drop_time || !origin_id || !dest_id) {
      return sendResponse(res, STATUS_KEYS.OK, {
        raw: {
          statusCode: 400,
          body: { status: false, message: "Missing required fields" },
        },
      });
    }

    const distance_km = await calculateDistanceKm(origin_id, dest_id);

    const result = calculateFareAmount(start_date, end_date, pickup_time, drop_time, distance_km);

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 200,
        body: {
          status: true,
          data: { ...result, distance_km },
        },
      },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { status: false, message: err.message },
      },
    });
  }
});

router.post("/delete-account", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return sendResponse(res, STATUS_KEYS.OK, {
        raw: {
          statusCode: 400,
          body: { status: false, message: "userId is required" },
        },
      });
    }

    const result = await deleteAccountByRole(Number(userId));

    // your service already returns some {status:..., message?...} etc
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 200, body: result },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { status: false, message },
      },
    });
  }
});

router.post("/generate-pdf", async (req, res) => {
  try {
    const fareData = req.body;
    const result = await generateAndUploadFarePdf(fareData);

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 200, body: { status: true, data: result } },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { status: false, message: error.message || "Internal Server Error" },
      },
    });
  }
});

router.post("/update_external_id", async (req, res) => {
  try {
    const user_id = req.body;
    console.log("user", user_id);

    const result = await pool.query(
      `
      UPDATE users
      SET external_id = $1
      WHERE id = $2
      `,
      [`tdrivers_user_${user_id?.userId}`, user_id?.userId]
    );

    console.log("result --", result);

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 200, body: { status: true, data: result } },
    });
  } catch (error: any) {
    console.error("update_external_id error:", error);

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { status: false, message: error.message || "Internal Server Error" },
      },
    });
  }
});

export default router;