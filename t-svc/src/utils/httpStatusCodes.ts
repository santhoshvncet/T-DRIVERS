export const HTTP_RESPONSES = {
  /* ---------- EXISTING (UNCHANGED) ---------- */
  OK: {
    POST: { statusCode: 201, message: "Data created successfully" },
    GET: { statusCode: 200, message: "Data fetched successfully" },
    PUT: { statusCode: 200, message: "Data updated successfully" },
    DELETE: { statusCode: 200, message: "Data deleted successfully" },
  },

  FETCH_OK: { statusCode: 200, message: "Data fetched successfully" },

  BAD_REQUEST: { statusCode: 400, message: "Bad request. Please check your input" },
  MISSING_FIELD: (field: string) => ({
    statusCode: 400,
    message: `Missing required field: ${field}`,
  }),
  UNAUTHORIZED: { statusCode: 401, message: "Unauthorized. Authentication required" },
  FORBIDDEN: { statusCode: 403, message: "Forbidden. You do not have access to this Data" },
  NOT_FOUND: { statusCode: 404, message: "Data not found" },
  METHOD_NOT_ALLOWED: { statusCode: 405, message: "Method not allowed for this endpoint" },
  CONFLICT: { statusCode: 409, message: "Conflict" },
  UNPROCESSABLE_ENTITY: { statusCode: 422, message: "Validation failed" },
  TOO_MANY_REQUESTS: { statusCode: 429, message: "Too many requests. Please try again later" },

  INTERNAL_SERVER_ERROR: { statusCode: 500, message: "Internal server error. Something went wrong" },
  NOT_IMPLEMENTED: { statusCode: 501, message: "Not implemented. This feature is not available" },
  BAD_GATEWAY: { statusCode: 502, message: "Bad gateway. Server received an invalid response" },
  SERVICE_UNAVAILABLE: { statusCode: 503, message: "Service unavailable. Please try again later" },
  GATEWAY_TIMEOUT: { statusCode: 504, message: "Gateway timeout. Server did not respond in time" },

  /* ---------- ADD ONLY (SAFE) ---------- */
  POST: { statusCode: 201, message: "Data created successfully" },
  PUT: { statusCode: 200, message: "Data updated successfully" },
  DELETE: { statusCode: 200, message: "Data deleted successfully" },
} as const;

export const STATUS_KEYS = {
  OK: "OK",
  FETCH_OK: "FETCH_OK",

  BAD_REQUEST: "BAD_REQUEST",
  MISSING_FIELD: "MISSING_FIELD",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
  BAD_GATEWAY: "BAD_GATEWAY",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  GATEWAY_TIMEOUT: "GATEWAY_TIMEOUT",

  /* ---------- ADD ONLY ---------- */
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
} as const;

export type HTTP_RESPONSE_KEY = keyof typeof HTTP_RESPONSES;
export type STATUS_KEY = keyof typeof STATUS_KEYS;
export type HttpResponse = | typeof HTTP_RESPONSES[Exclude<HTTP_RESPONSE_KEY, "MISSING_FIELD">] | ReturnType<typeof HTTP_RESPONSES.MISSING_FIELD>;