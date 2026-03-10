import { Router, Request, Response } from "express";
import { getDriverProfile } from "./actions/getDriverProfile";
import { landingPage } from "./actions/landingPage";
import insertDriver from "./actions/insertDriverForm";
import { getCity } from "./actions/getCity";
import { getBankAccountsByUserId } from "./actions/getDriverBankDetails";
import { addBankAccount } from "./actions/postBankDetails";
import { getTripsByUser } from "./actions/getDriverBookingdata";
import { getOwnerDetails } from "./actions/getDriverOnViewOwnerData";
import insertDriverRegDetails from "./actions/insertDriverRegDetails";
import upload from "../../config/multerconfig";
import { markNotInterested } from "./actions/updateDriverInterest";
import { markConfirmed } from "./actions/updateConfirmedInterest";
import insertDriverBankDetails from "./actions/insertBankforDriver";
import getDriverRegDetails from "./actions/getDriverRegDetails";
import { getDriverBookingHistory } from "./actions/getPaymentHistoryDriver";
import { updateTripStatus } from "./actions/updateTripStatus";
import { updateDriverAccountDetails } from "./actions/driverAccountdetailsEdit";
import { verifyTripOTP } from "./actions/validateOtp";
import { getConfirmedTrip } from "./actions/getDriverConfirmBookingDetails";
import { getDriverTripStatus } from "./actions/getDriverTripStatus";
import { pool } from "../db";
import { getDriverFare } from "./actions/getDriverFareAmount";
import updateDriverProfileImage from "./actions/driver_profile_image";
import { getDriverBalance } from "../users/payments/getDriverBalance";
import { STATUS_KEYS } from "../../utils/httpStatusCodes";
import { errorPayload, sendResponse } from "../../utils/response";
import getDriverTransactionsService from "./actions/getDriverTransactionDetails";
import getDriverTransactions from "./actions/getDriverTransactionDetails";
import { createAndSendNotification } from "../users/actions/notification";
import { getDriverStatus } from "./actions/getDriverStatus";
import { driverStatus } from "./actions/updateDriverActiveStatus";
import { uploadCarTrip } from "./actions/uploadCarTrip";

const router = Router();

router.get("/driver/:id", async (req: any, res: any) => {
  const driverId = parseInt(req.params.id, 10);

  if (isNaN(driverId)) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 400, body: { status: false, message: "Invalid driver ID" } },
    });
  }

  try {
    const response = await getDriverProfile(driverId);

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 200, body: response },
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 500, body: { status: false, message: "Internal Server Error" } },
    });
  }
});

router.post("/register_driver", async (req: any, res: any) => {
  try {
    const data = await insertDriver(req.body);

    if (!data.status) {
      return sendResponse(res, STATUS_KEYS.OK, {
        raw: { statusCode: 400, body: { status: false, error: data.error } },
      });
    }

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 200,
        body: { status: true, message: "Driver registered successfully!", data },
      },
    });
  } catch (error: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 500, body: { status: false, message: error.message || "Internal Server Error" } },
    });
  }
});

router.get("/city_suggestions", async (req: any, res: any) => {
  const { query } = req.query;

  if (!query || typeof query !== "string") {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 400, body: { status: false, message: "Query is required" } },
    });
  }

  try {
    const results = await getCity(query);
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 200, body: { status: true, data: results } },
    });
  } catch (error) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 500, body: { status: false, message: "Internal server error" } },
    });
  }
});

router.post("/register_driver_details", async (req: any, res: any) => {
  try {
    const driverData = { ...req.body, user_id: req.body.user_id };

    const response = await insertDriverRegDetails(Number(req.body.user_id), driverData);

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 200,
        body: {
          status: true,
          message: "Driver registration details saved successfully!",
          data: response.driver,
        },
      },
    });
  } catch (error: any) {
    console.error("Error in /register_driver_details:", error.message);
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 500, body: { status: false, message: error.message || "Internal Server Error" } },
    });
  }
});

router.post(
  "/upload_driver_profile_image",
  upload.single("profile_photo"),
  async (req, res) => {
    try {
      const user_id = Number(req.body.user_id);
      const result = await updateDriverProfileImage(user_id, req.file || null);

      return sendResponse(res, STATUS_KEYS.OK, {
        raw: { statusCode: 201, body: result },
      });
    } catch (err: any) {
      console.error("Profile image route error:", err);
      return sendResponse(res, STATUS_KEYS.OK, {
        raw: {
          statusCode: 400,
          body: { status: false, message: err.message || "Failed to upload profile image" },
        },
      });
    }
  }
);

router.get("/get_driver_reg/:id", async (req, res) => {
  try {
    const user_id = req.params.id;

    if (!user_id) {
      return sendResponse(res, STATUS_KEYS.OK, {
        raw: { statusCode: 400, body: { status: false, message: "Invalid or missing user_id." } },
      });
    }

    const response = await getDriverRegDetails(Number(user_id));

    if (!response.status) {
      return sendResponse(res, STATUS_KEYS.OK, {
        raw: { statusCode: 404, body: response },
      });
    }

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 200, body: response },
    });
  } catch (error: any) {
    console.error("Error in GET /driver/registration:", error);
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 500, body: { status: false, message: "Internal server error.", error } },
    });
  }
});

router.post("/bank_details_for_driver", async (req, res) => {
  try {
    const user_id = Number(req.body.user_id);

    const payload = {
      account_holder: req.body.account_holder,
      bank_name: req.body.bank_name,
      account_number: req.body.account_number,
      ifsc: req.body.ifsc,
      passbook_front_image_url: req.body.passbook_front_image_url,
    };

    const result = await insertDriverBankDetails(user_id, payload);

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 201,
        body: { status: true, message: "Driver bank details saved successfully!", data: result.bank },
      },
    });
  } catch (err: any) {
    console.error("Bank details route error:", err);

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 500, body: { status: false, message: "Internal server error.", err } },
    });
  }
});

router.post("/update_landing_page", async (req: any, res: any) => {
  const { landing_page, id } = req.body;

  try {
    const response = await landingPage(landing_page, id);
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 200, body: { status: true, data: response } },
    });
  } catch (error) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 500, body: { status: false, message: "Internal server error.", error } },
    });
  }
});

router.post(
  "/driver/update_account",
  upload.single("licenseFile"),
  async (req, res) => {
    try {
      const languages =
        req.body.languages && req.body.languages !== ""
          ? JSON.parse(req.body.languages)
          : null;

      const data = await updateDriverAccountDetails(Number(req.body.userId), {
        name: req.body.name,
        email: req.body.email,
        address: req.body.address,
        transmission: req.body.transmission,
        board_type: req.body.boardType,
        languages,
        licenseFile: req.file || null,
      });

      if (!data.status) {
        return sendResponse(res, STATUS_KEYS.OK, {
          raw: { statusCode: 400, body: { status: false, error: data.error } },
        });
      }

      return sendResponse(res, STATUS_KEYS.OK, {
        raw: {
          statusCode: 200,
          body: { status: true, message: "Driver account updated successfully", data },
        },
      });
    } catch (err: any) {
      return sendResponse(res, STATUS_KEYS.OK, {
        raw: { statusCode: 500, body: { status: false, error: err.message || "Internal server error" } },
      });
    }
  }
);

router.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 200, body: "OK", type: "send" },
    });
  } catch (e) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 500, body: "DB DOWN", type: "send" },
    });
  }
});

router.get("/bookinghistory/driver/:driverId", async (req, res) => {
  try {
    const result = await getDriverBookingHistory(req.params.driverId);

    if (!result.status) {
      const code = result.msg === "Invalid driverId" ? 400 : 500;

      return sendResponse(res, STATUS_KEYS.OK, {
        raw: { statusCode: code, body: { status: false, msg: result.msg || "Server error" } },
      });
    }

    // EXACT old success body
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 200, body: { status: true, payments: result.data } },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 500, body: { status: false, msg: "Server error" } },
    });
  }
});

router.get("/transaction/:userId", async (req, res) => {
  try {
    const result = await getDriverTransactions(req.params.userId);

    if (!result.status) {
      const code =
        result.msg === "Invalid user_id" ? 400 :
        result.notFound ? 404 :
        500;

      return sendResponse(res, STATUS_KEYS.OK, {
        raw: { statusCode: code, body: { message: result.msg || "Internal server error" } },
      });
    }

    const rows = result.data ?? []; // <- FIX

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 200,
        body: { success: true, count: rows.length, data: rows },
      },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 500, body: { message: "Internal server error" } },
    });
  }
});

router.post("/add_bank-_details/:userId", async (req, res) => {
  try {
    // keep existing behavior: reads from body (even though route has :userId)
    const result = await addBankAccount(req.body);

    if (!result.status) {
      const code = result.badRequest ? 400 : 500;

      // EXACT old error bodies:
      // - 400: { success:false, message:"Missing required fields" }
      // - 500: { message:"Internal server error" }
      const body = result.badRequest
        ? { success: false, message: result.msg }
        : { message: result.msg };

      return sendResponse(res, STATUS_KEYS.OK, {
        raw: { statusCode: code, body, type: "json" },
      });
    }

    // EXACT old success body (201)
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 201,
        body: {
          success: true,
          message: result.msg,
          data: result.data,
        },
        type: "json",
      },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 500, body: { message: "Internal server error" }, type: "json" },
    });
  }
});

router.get("/bank_details/:userId", async (req, res) => {
  try {
    const result = await getBankAccountsByUserId(req.params.userId);

    if (!result.status) {
      const code = result.badRequest ? 400 : 500;

      // EXACT old error body: { message: "..." }
      return sendResponse(res, STATUS_KEYS.OK, {
        raw: { statusCode: code, body: { message: result.msg || "Internal server error" }, type: "json" },
      });
    }

    const rows = result.data ?? [];

    // EXACT old success body
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 200,
        body: { success: true, count: rows.length, data: rows },
        type: "json",
      },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 500, body: { message: "Internal server error" }, type: "json" },
    });
  }
});

router.get("/booking_details/:userId", async (req, res) => {
  try {
    const result = await getTripsByUser(req.params.userId);

    if (!result.status) {
      const code = result.badRequest ? 400 : result.notFound ? 404 : 500;

      // EXACT old error bodies:
      // 404: { success:false, message:"Driver not found" }
      // 500: { success:false, message:"Server Error" }
      // (for invalid user_id we keep same style)
      return sendResponse(res, STATUS_KEYS.OK, {
        raw: {
          statusCode: code,
          body: { success: false, message: result.msg || "Server Error" },
          type: "json",
        },
      });
    }

    const trips = result.data ?? [];

    // EXACT old success body
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 200,
        body: { success: true, count: trips.length, data: trips },
        type: "json",
      },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 500, body: { success: false, message: "Server Error" }, type: "json" },
    });
  }
});

router.get("/on_view/owner_details/:ownerId", async (req, res) => {
  try {
    const result = await getOwnerDetails(req.params.ownerId);

    if (!result.status) {
      const code = result.badRequest ? 400 : result.notFound ? 404 : 500;

      // EXACT old error bodies
      // 400/404: { success:false, message:"..." }
      // 500:     { success:false, message:"Server error", error }
      const body =
        code === 500
          ? { success: false, message: "Server error", error: result.error }
          : { success: false, message: result.msg };

      return sendResponse(res, STATUS_KEYS.OK, {
        raw: { statusCode: code, body, type: "json" },
      });
    }

    // EXACT old success body
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 200,
        body: {
          success: true,
          data: result.data,
          message: result.msg, // "Owner details fetched successfully"
        },
        type: "json",
      },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { success: false, message: "Server error", error: err },
        type: "json",
      },
    });
  }
});

router.put("/driver_interest/reject/update", async (req, res) => {
  try {
    const result = await markNotInterested(req.body);

    if (!result.status) {
      // keep EXACT old behavior: missing fields returns 500 (even though it's wrong)
      const code = result.missing ? 500 : 500;

      return sendResponse(res, STATUS_KEYS.OK, {
        raw: {
          statusCode: code,
          body: {
            success: false,
            message: result.msg,
            ...(result.error ? { error: result.error } : {}),
          },
          type: "json",
        },
      });
    }

    // old code always returns 200 on success
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 200,
        body: {
          success: true,
          message: result.msg,
          data: result.data,
        },
        type: "json",
      },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { success: false, message: "Internal server error", error: err },
        type: "json",
      },
    });
  }
});

router.put("/driver_interest/confirm/update", async (req, res) => {
  try {
    const io = req.app.get("io"); // socket instance

    const result = await markConfirmed(req.body);

    if (!result.status) {
      const code = result.badRequest ? 400 : 500;

      // EXACT old error body
      return sendResponse(res, STATUS_KEYS.OK, {
        raw: {
          statusCode: code,
          body: { success: false, message: result.msg },
          type: "json",
        },
      });
    }

    // Notification (non-blocking for response)
    (async () => {
      try {
        if (result.ownerUserId) {
          await createAndSendNotification({
            title: "Trip Confirmed ✅",
            message:
              "A driver has accepted your trip. View the trip details for more information.",
            userIds: [result.ownerUserId],
          });
        }
      } catch (e) {
        console.error("Owner notification failed:", e);
      }
    })();

    // socket emit (optional)
    // io.emit("newInterestedDriver", { trip_id: result.trip_id });

    // EXACT old success body
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 200,
        body: {
          success: true,
          message: "Driver accepted successfully",
          data: result.data,
        },
        type: "json",
      },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { success: false, message: "Internal server error" },
        type: "json",
      },
    });
  }
});

router.get("/confirmed/trip_details/:driverId", async (req, res) => {
  try {
    const result = await getConfirmedTrip(req.params.driverId);

    if (!result.status) {
      const code = result.badRequest ? 400 : 500;

      return sendResponse(res, STATUS_KEYS.OK, {
        raw: {
          statusCode: code,
          body: { success: false, message: result.msg },
          type: "json",
        },
      });
    }

    const data = result.data ?? { driverId: String(req.params.driverId), trip: [] };

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 200,
        body: { success: true, driverId: data.driverId, trip: data.trip },
        type: "json",
      },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { success: false, message: "Server Error" },
        type: "json",
      },
    });
  }
});

router.post("/update_trip_status", async (req, res) => {
  try {
    const result = await updateTripStatus(req.body);

    if (!result.status) {
      const code = result.badRequest ? 400 : result.notFound ? 404 : 500;

      // EXACT old error body
      return sendResponse(res, STATUS_KEYS.OK, {
        raw: {
          statusCode: code,
          body: { success: false, message: result.msg, ...(result.error ? { error: result.error } : {}) },
          type: "json",
        },
      });
    }

    // EXACT old success body
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 200,
        body: {
          success: true,
          message: result.msg,
          data: result.data,
        },
        type: "json",
      },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { success: false, message: "Internal server error.", error: err },
        type: "json",
      },
    });
  }
});

router.put(
  "/uploadCarTrips",
  upload.fields([
    { name: "photo_front", maxCount: 1 },
    { name: "photo_left", maxCount: 1 },
    { name: "photo_back", maxCount: 1 },
    { name: "photo_right", maxCount: 1 },
  ]),
  async (req: any, res: any) => {
    try {
      const result = await uploadCarTrip(req.body, req.files);

      if (!result.status) {
        const code = result.badRequest ? 400 : result.notFound ? 404 : 500;

        // EXACT old error bodies
        return sendResponse(res, STATUS_KEYS.OK, {
          raw: {
            statusCode: code,
            body: {
              success: false,
              message: result.msg,
              ...(result.error ? { error: result.error.message ?? result.error } : {}),
            },
            type: "json",
          },
        });
      }

      // Detect whether this was fetch-only (no uploads)
      const isFetchOnly = !("uploadedUrls" in result);

      if (isFetchOnly) {
        // EXACT old success (fetch)
        return sendResponse(res, STATUS_KEYS.OK, {
          raw: {
            statusCode: 200,
            body: {
              success: true,
              message: result.msg, // "Car images fetched successfully"
              data: result.data,
            },
            type: "json",
          },
        });
      }

      // EXACT old success (upload)
      return sendResponse(res, STATUS_KEYS.OK, {
        raw: {
          statusCode: 200,
          body: {
            success: true,
            message: result.msg, // "Car photos for startTrip/endTrip uploaded successfully"
            data: result.data,
            uploadedUrls: (result as any).uploadedUrls,
          },
          type: "json",
        },
      });
      } catch (err: any) {
        return sendResponse(res, STATUS_KEYS.OK, {
          raw: {
            statusCode: 500,
            body: {
              success: false,
              message: "Internal server error",
              error: err?.message,
            },
            type: "json",
          },
        });
      }
    }
  );


router.get("/driver_balance/:user_id", async (req: Request, res: Response) => {
  try {
    const user_id = Number(req.params.user_id);

    const balancePaise = await getDriverBalance(user_id);

    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 200,
        body: {
          status: "success",
          data: {
            balance_paise: balancePaise,
            balance_rupees: balancePaise / 100,
          },
        },
      },
    });
  } catch (error: any) {
    console.error("Error in generating balance", error);
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { status: false, message: error.message || "Internal Server Error" },
      },
    });
  }
});

router.post("/validate_otp", async (req, res) => {
  try {
    const result = await verifyTripOTP(req.body);

    if (!result.status) {
      const code = result.badRequest ? 400 : result.notFound ? 404 : result.unauthorized ? 401 : 500;

      // EXACT old error bodies
      return sendResponse(res, STATUS_KEYS.OK, {
        raw: {
          statusCode: code,
          body: { success: false, message: result.msg },
          type: "json",
        },
      });
    }

    // EXACT old success body
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 200,
        body: {
          success: true,
          message: result.msg,
          data: result.data,
        },
        type: "json",
      },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { success: false, message: "Internal server error" },
        type: "json",
      },
    });
  }
});

router.post("/update_active_status", async (req, res) => {
  try {
    const result = await driverStatus(req.body);

    if (!result.status) {
      const code = result.badRequest ? 400 : 500;

      // EXACT old error body
      return sendResponse(res, STATUS_KEYS.OK, {
        raw: { statusCode: code, body: { success: false, message: result.msg }, type: "json" },
      });
    }

    // EXACT old success body
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 200,
        body: { success: true, message: result.msg, data: result.data },
        type: "json",
      },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { success: false, message: "Internal server error" },
        type: "json",
      },
    });
  }
});

router.get("/get_driver_status/:driverId", async (req, res) => {
  try {
    const result = await getDriverStatus(req.params.driverId);

    if (!result.status) {
      const code = result.notFound ? 404 : result.unauthorized ? 401 : 500;

      // EXACT old error bodies
      const body =
        result.notFound
          ? { success: false, message: "driver not found" }
          : result.unauthorized
          ? { success: false }
          : { success: false, message: "internal server error", error: result.error };

      return sendResponse(res, STATUS_KEYS.OK, {
        raw: { statusCode: code, body, type: "json" },
      });
    }

    // EXACT old success body
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 200, body: { success: true, data: result.data }, type: "json" },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { success: false, message: "internal server error", error: err },
        type: "json",
      },
    });
  }
});

router.get("/get_trip_status/:tripId", async (req, res) => {
  try {
    const result = await getDriverTripStatus(req.params.tripId);

    if (!result.status) {
      const code = result.badRequest ? 400 : result.notFound ? 404 : 500;

      // EXACT old error body
      return sendResponse(res, STATUS_KEYS.OK, {
        raw: {
          statusCode: code,
          body: { success: false, message: result.msg },
          type: "json",
        },
      });
    }

    // EXACT old success body
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 200,
        body: { success: true, message: result.msg, data: result.data },
        type: "json",
      },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: {
        statusCode: 500,
        body: { success: false, message: "Internal Server Error" },
        type: "json",
      },
    });
  }
});

router.post("/get_trip_fare", async (req, res) => {
  try {
    const result = await getDriverFare(req.body);

    if (!result.status) {
      // keep exact old status codes + bodies
      if (result.notFound) {
        return sendResponse(res, STATUS_KEYS.OK, {
          raw: { statusCode: 404, body: { message: "tripId not found" }, type: "json" },
        });
      }

      if (result.badRequest && result.emptyBody) {
        return sendResponse(res, STATUS_KEYS.OK, {
          raw: { statusCode: 400, body: {}, type: "json" },
        });
      }

      return sendResponse(res, STATUS_KEYS.OK, {
        raw: {
          statusCode: 500,
          body: { success: false, message: result.error ?? result.msg },
          type: "json",
        },
      });
    }

    // EXACT old success body (already built in service)
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 200, body: result.data, type: "json" },
    });
  } catch (err: any) {
    return sendResponse(res, STATUS_KEYS.OK, {
      raw: { statusCode: 500, body: { success: false, message: err }, type: "json" },
    });
  }
});

export default router;