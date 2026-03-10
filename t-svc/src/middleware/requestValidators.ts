// src/middlewares/validators.ts
import { Request, Response, NextFunction } from "express";
import { STATUS_KEYS } from "../utils/httpStatusCodes"; // adjust path if needed
import { sendResponse } from "../utils/response";      // adjust path if needed

/** ---------- Generic helpers ---------- */
export const isNonEmptyString = (value: any): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const parsePositiveNumber = (value: any): number | null => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
};

export const parseNonNegativeNumber = (value: any): number | null => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) && num >= 0 ? num : null;
};

export const isPositiveIntString = (value: any): boolean =>
  typeof value === "string" && /^\d+$/.test(value) && Number(value) > 0;

export const isPositiveInt = (value: any): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

export const parsePositiveInt = (value: any): number | null => {
  if (isPositiveInt(value)) return value;
  if (typeof value === "string" && isPositiveIntString(value)) {
    return Number(value);
  }
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
};

/** ======================================================================
 *  PARAM VALIDATORS
 *  - for fields in req.params (driverId, ownerId, tripId, generic id)
 * ===================================================================== */

/**
 * Generic numeric :id validator for any param
 * Example: router.get("/users/:id", validateIdParam("id", "user id"), handler)
 */
export const validateIdParam =
  (paramName: string, label?: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    const raw = req.params[paramName];

    if (!raw) {
      return sendResponse(res, STATUS_KEYS.MISSING_FIELD, {
        field: label || paramName,
      });
    }

    const parsed = parsePositiveInt(raw);
    if (parsed === null) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: `${label || paramName} must be a positive integer`,
      });
    }

    // normalize to number
    (req.params as any)[paramName] = parsed;
    next();
  };

/** Specific short-hands using the generic one */
export const validateDriverIdParam = validateIdParam("driverId", "driverId");
export const validateOwnerIdParam = validateIdParam("ownerId", "ownerId");
export const validateTripIdParam = validateIdParam("tripId", "tripId");

/** ======================================================================
 *  BODY VALIDATORS
 *  - for fields in req.body (tripId, etc.)
 * ===================================================================== */

/**
 * Generic numeric id in body
 * Example: router.post("/trip", validateIdInBody("tripId"), handler)
 */
export const validateIdInBody =
  (fieldName: string, label?: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    const raw = (req.body as any)[fieldName];

    if (raw == null) {
      return sendResponse(res, STATUS_KEYS.MISSING_FIELD, {
        field: label || fieldName,
      });
    }

    const parsed = parsePositiveInt(raw);
    if (parsed === null) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: `${label || fieldName} must be a positive integer`,
      });
    }

    (req.body as any)[fieldName] = parsed;
    next();
  };

/** Trip‑ID‑specific shorthand for body */
export const validateTripIdInBody = validateIdInBody("tripId", "tripId");

/** ======================================================================
 *  QUERY VALIDATORS
 *  - for pagination: page & limit in req.query
 * ===================================================================== */

/**
 * Generic pagination validator
 * - validates page & limit as positive integers (if provided)
 * - sets default page = 1, limit = 50
 * - normalizes req.query.page / req.query.limit to numbers
 */
export const validatePageQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const rawPage = req.query.page as string | undefined;
  const rawLimit = req.query.limit as string | undefined;

  if (rawPage !== undefined) {
    const parsedPage = parsePositiveInt(rawPage);
    if (parsedPage === null) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "page must be a positive integer",
      });
    }
    (req.query.page as any) = parsedPage;
  } else {
    (req.query.page as any) = 1;
  }

  if (rawLimit !== undefined) {
    const parsedLimit = parsePositiveInt(rawLimit);
    if (parsedLimit === null) {
      return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
        error: "limit must be a positive integer",
      });
    }
    (req.query.limit as any) = parsedLimit;
  } else {
    (req.query.limit as any) = 50;
  }

  const page = req.query.page as any as number;
  const limit = req.query.limit as any as number;

  if (!isPositiveInt(page) || !isPositiveInt(limit)) {
    return sendResponse(res, STATUS_KEYS.BAD_REQUEST, {
      error: "page and limit must be greater than 0",
    });
  }

  next();
};