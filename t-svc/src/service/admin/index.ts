// src/modules/admin/routes.ts (or similar)
import { Router, Request, Response } from "express";
import upload from "../../config/multerconfig";
import { STATUS_KEYS } from "../../utils/httpStatusCodes";
import { errorPayload, sendResponse } from "../../utils/response";
import { createAdmin } from "./actions/createAdmin";
import { deleteAdminById } from "./actions/deleteAdmin";
import { getAllAdmin } from "./actions/getAllAdmin";
import { getAllDrivers } from "./actions/getAllDrivers";
import { getAllOnewayTrips } from "./actions/getAllOnewayTrips";
import { getAllOwners } from "./actions/getAllOwners";
import { getAllReport } from "./actions/getAllReport";
import { getAllTrips } from "./actions/getAllTrips";
import { getDashboardTotal } from "./actions/getDashboardTotal";
import { getDriverById } from "./actions/getDriverbyId";
import { getDriverConfig } from "./actions/getDriverConfig";
import { getOwnerById } from "./actions/getOwnerbyId";
import { getReportById } from "./actions/getReportById";
import { updateAdmin } from "./actions/updateAdmin";
import { updateDriverAllowance } from "./actions/updateDriverAllowance";
import { updateDriverById } from "./actions/updateDriverbyId";
import { updateDriverConfig } from "./actions/updateDriverConfig";
import { updateOwnerByIdWithFiles } from "./actions/updateOwnerbyId";
import { isPositiveIntString, isNonEmptyString, parsePositiveNumber, parseNonNegativeNumber } from "../../middleware/requestValidators";

const router = Router();
/** ------------------- OWNERS ------------------- */
router.get("/getAllOwners", async (req: Request, res: Response) => {
  try {
    const owners = await getAllOwners();
    return sendResponse(res, STATUS_KEYS.OK, { data: owners, req });
  } catch (error) {
    console.error("Error in /getAllOwners:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.get("/getOwnerbyId/:ownerId", async (req: Request, res: Response) => {
  const { ownerId } = req.params;

  if (!ownerId) {
    return sendResponse(res, STATUS_KEYS.MISSING_FIELD, { field: "ownerId" });
  }

  // Assuming numeric ID; if it's UUID, replace with isNonEmptyString
  if (!isPositiveIntString(ownerId)) {
    return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
      error: "ownerId must be a positive integer",
    });
  }

  try {
    const owner = await getOwnerById(ownerId);
    return sendResponse(res, STATUS_KEYS.OK, { data: owner, req });
  } catch (error) {
    console.error("Error in getOwnerById:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.put(
  "/updateOwner/:ownerId",
  upload.fields([
    { name: "car_image", maxCount: 1 },
    { name: "car_insurance", maxCount: 1 },
    { name: "rc", maxCount: 1 },
    { name: "front", maxCount: 1 },
    { name: "left", maxCount: 1 },
    { name: "back", maxCount: 1 },
    { name: "right", maxCount: 1 },
    { name: "passbook_front_image", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const { ownerId } = req.params;

      if (!ownerId) {
        return sendResponse(res, STATUS_KEYS.MISSING_FIELD, {
          field: "ownerId",
        });
      }
      if (!isPositiveIntString(ownerId)) {
        return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
          error: "ownerId must be a positive integer",
        });
      }

      const files = (req.files || {}) as Record<string, Express.Multer.File[]>;
      const payload: any = { ...req.body };

      const fileFields = [
        "car_image",
        "car_insurance",
        "rc",
        "front",
        "left",
        "back",
        "right",
        "passbook_front_image",
      ];

      let hasUpdateData = Object.keys(req.body || {}).length > 0;

      fileFields.forEach((key) => {
        if (files[key] && files[key][0]) {
          payload[key] = files[key][0];
          hasUpdateData = true;
        }
      });

      if (!hasUpdateData) {
        return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
          error: "No data provided to update owner",
        });
      }

      const updatedOwner = await updateOwnerByIdWithFiles(ownerId, payload);
      return sendResponse(res, STATUS_KEYS.OK, { data: updatedOwner, req });
    } catch (error) {
      console.error("Error updating owner:", error);
      return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
        error: errorPayload(error),
      });
    }
  }
);

/** ------------------- DRIVERS ------------------- */
router.get("/getAllDrivers", async (req: Request, res: Response) => {
  try {
    const drivers = await getAllDrivers();
    return sendResponse(res, STATUS_KEYS.OK, { data: drivers, req });
  } catch (error) {
    console.error("Error in /getAllDrivers:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.get("/getDriverbyId/:driverId", async (req: Request, res: Response) => {
  const { driverId } = req.params;

  if (!driverId) {
    return sendResponse(res, STATUS_KEYS.MISSING_FIELD, { field: "driverId" });
  }
  if (!isPositiveIntString(driverId)) {
    return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
      error: "driverId must be a positive integer",
    });
  }

  try {
    const driver = await getDriverById(driverId);
    return sendResponse(res, STATUS_KEYS.OK, { data: driver, req });
  } catch (error) {
    console.error("Error in getDriverById:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.put(
  "/updateDriver/:driverId",
  upload.fields([
    { name: "driving_license", maxCount: 1 },
    { name: "aadhar_card", maxCount: 1 },
    { name: "profile_photo", maxCount: 1 },
    { name: "passbook_front_image", maxCount: 1 },
    { name: "front", maxCount: 1 },
    { name: "left", maxCount: 1 },
    { name: "back", maxCount: 1 },
    { name: "right", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const { driverId } = req.params;

      if (!driverId) {
        return sendResponse(res, STATUS_KEYS.MISSING_FIELD, {
          field: "driverId",
        });
      }
      if (!isPositiveIntString(driverId)) {
        return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
          error: "driverId must be a positive integer",
        });
      }

      const files = (req.files || {}) as Record<string, Express.Multer.File[]>;
      const payload: any = { ...req.body };

      const fileKeys = [
        "driving_license",
        "aadhar_card",
        "profile_photo",
        "passbook_front_image",
        "front",
        "left",
        "back",
        "right",
      ];

      let hasUpdateData = Object.keys(req.body || {}).length > 0;

      fileKeys.forEach((key) => {
        if (files[key] && files[key][0]) {
          payload[key] = files[key][0].buffer;
          hasUpdateData = true;
        }
      });

      if (!hasUpdateData) {
        return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
          error: "No data provided to update driver",
        });
      }

      const updatedDriver = await updateDriverById(driverId, payload);
      return sendResponse(res, STATUS_KEYS.OK, { data: updatedDriver, req });
    } catch (error) {
      console.error("Error updating driver:", error);
      return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
        error: errorPayload(error),
      });
    }
  }
);

/** ------------------- ADMIN ------------------- */
router.get("/getAllAdmin", async (req: Request, res: Response) => {
  try {
    const admins = await getAllAdmin();
    return sendResponse(res, STATUS_KEYS.OK, { data: admins, req });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.post("/createAdmin", async (req: Request, res: Response) => {
  try {
    const { name, phone, role } = req.body;

    if (!name || !phone || role == null) {
      return sendResponse(res, STATUS_KEYS.MISSING_FIELD, {
        field: "name, phone, role",
      });
    }

    if (!isNonEmptyString(name)) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "name must be a non-empty string",
      });
    }

    if (!isNonEmptyString(phone) || !/^\d{10}$/.test(phone)) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "phone must be a valid 10-digit number",
      });
    }

    // role can be string or string[]
    if (Array.isArray(role)) {
      if (role.length === 0) {
        return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
          error: "role array cannot be empty",
        });
      }
      const invalid = role.some(
        (r: any) => typeof r !== "string" || !r.trim()
      );
      if (invalid) {
        return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
          error: "each role in array must be a non-empty string",
        });
      }
    } else if (!isNonEmptyString(role)) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "role must be a non-empty string or an array of strings",
      });
    }

    const admin = await createAdmin({ name, phone, role });
    return sendResponse(res, STATUS_KEYS.OK, { data: admin, req });
  } catch (error) {
    console.error("Error creating admin:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.put("/updateAdmin", async (req: Request, res: Response) => {
  try {
    const { id, role } = req.body;

    if (id == null || role == null) {
      return sendResponse(res, STATUS_KEYS.MISSING_FIELD, {
        field: "id and role",
      });
    }

    const parsedId = parsePositiveNumber(id);
    if (parsedId === null) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "id must be a positive number",
      });
    }

    if (!Array.isArray(role) || role.length === 0) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "role must be a non-empty array of strings",
      });
    }

    if (!role.every((r: any) => isNonEmptyString(r))) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "each role must be a non-empty string",
      });
    }

    const updated = await updateAdmin({ id: parsedId, role });
    return sendResponse(res, STATUS_KEYS.OK, { data: updated, req });
  } catch (error) {
    console.error("Error updating admin:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.delete("/deleteAdmin/:id", async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;

    if (!rawId) {
      return sendResponse(res, STATUS_KEYS.MISSING_FIELD, { field: "id" });
    }

    if (!isPositiveIntString(rawId)) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "Valid admin id (positive integer) is required",
      });
    }

    const id = Number(rawId);

    const deleted = await deleteAdminById(id);
    if (!deleted) return sendResponse(res, STATUS_KEYS.NOT_FOUND);

    return sendResponse(res, STATUS_KEYS.OK, { data: deleted, req });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

/** ------------------- TRIPS ------------------- */
router.get("/getAllOnewayTrips", async (req: Request, res: Response) => {
  try {
    const trips = await getAllOnewayTrips();
    return sendResponse(res, STATUS_KEYS.OK, { data: trips, req });
  } catch (error) {
    console.error("Error fetching oneway trips:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.get("/getAllTrips", async (req: Request, res: Response) => {
  try {
    const rawPage = req.query.page as string | undefined;
    const rawLimit = req.query.limit as string | undefined;

    if (rawPage && !/^\d+$/.test(rawPage)) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "page must be a positive integer",
      });
    }
    if (rawLimit && !/^\d+$/.test(rawLimit)) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "limit must be a positive integer",
      });
    }

    const page = rawPage ? Number(rawPage) : 1;
    const limit = rawLimit ? Number(rawLimit) : 50;

    if (page <= 0 || limit <= 0) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "page and limit must be greater than 0",
      });
    }

    const offset = (page - 1) * limit;

    const tripsResponse = await getAllTrips(limit, offset);

    return sendResponse(res, STATUS_KEYS.OK, {
      message: "Users fetched successfully",
      data: tripsResponse.rows,
      hasMore: tripsResponse.rowCount === limit,
      page,
      limit,
      req,
    });
  } catch (error) {
    console.error("Error fetching trips:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.put("/updateDriverAllowance", async (req: Request, res: Response) => {
  try {
    const { tripId, driverAllowance } = req.body;

    if (tripId == null || driverAllowance == null) {
      return sendResponse(res, STATUS_KEYS.MISSING_FIELD, {
        field: "tripId, driverAllowance",
      });
    }

    const parsedTripId = parsePositiveNumber(tripId);
    const parsedAllowance = parseNonNegativeNumber(driverAllowance);

    if (parsedTripId === null || parsedAllowance === null) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "tripId must be > 0 and driverAllowance must be >= 0",
      });
    }

    const updatedTrip = await updateDriverAllowance(
      parsedTripId,
      parsedAllowance
    );
    if (!updatedTrip) return sendResponse(res, STATUS_KEYS.NOT_FOUND);

    return sendResponse(res, STATUS_KEYS.OK, { data: updatedTrip, req });
  } catch (error) {
    console.error("Error updating driver allowance:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

/** ------------------- REPORTS / DASHBOARD ------------------- */
router.get("/getAllReport", async (req: Request, res: Response) => {
  try {
    const reports = await getAllReport();
    return sendResponse(res, STATUS_KEYS.OK, { data: reports, req });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.post("/getReportById", async (req: Request, res: Response) => {
  try {
    const { type, id } = req.body;

    if (!type || id == null) {
      return sendResponse(res, STATUS_KEYS.MISSING_FIELD, {
        field: "type, id",
      });
    }

    if (!isNonEmptyString(type)) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "type must be a non-empty string",
      });
    }

    // Allow id as number or numeric string
    let normalizedId: number | string = id;

    if (typeof id === "number") {
      if (!Number.isFinite(id) || id <= 0) {
        return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
          error: "id must be a positive number",
        });
      }
      normalizedId = id;
    } else if (typeof id === "string") {
      if (!id.trim()) {
        return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
          error: "id must be a non-empty string",
        });
      }
      // If you want strictly numeric id, enforce here:
      // const numId = parsePositiveNumber(id);
      // if (numId === null) {
      //   return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
      //     error: "id must be a positive integer",
      //   });
      // }
      // normalizedId = numId;
    } else {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "id must be a string or a number",
      });
    }

    const reportData = await getReportById(normalizedId, type);

    return sendResponse(res, STATUS_KEYS.FETCH_OK, {
      data: reportData,
    });
  } catch (error) {
    console.error("Error fetching report by id:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.get("/getDashboardTotal", async (req: Request, res: Response) => {
  try {
    const dashboardTotal = await getDashboardTotal();
    return sendResponse(res, STATUS_KEYS.OK, { data: dashboardTotal, req });
  } catch (error) {
    console.error("Error fetching dashboard total:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

/** ------------------- CONFIG ------------------- */
router.get("/getConfig", async (req: Request, res: Response) => {
  try {
    const config = await getDriverConfig();
    return sendResponse(res, STATUS_KEYS.OK, { data: config, req });
  } catch (error) {
    console.error("Error fetching driver config:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

router.put("/updateConfig", async (req: Request, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "No config fields provided to update",
      });
    }

    // If you know exact config shape, you can add more type checks here.

    const updatedConfig = await updateDriverConfig(req.body);
    return sendResponse(res, STATUS_KEYS.OK, { data: updatedConfig, req });
  } catch (error) {
    console.error("Error updating config:", error);
    return sendResponse(res, STATUS_KEYS.INTERNAL_SERVER_ERROR, {
      error: errorPayload(error),
    });
  }
});

export default router;