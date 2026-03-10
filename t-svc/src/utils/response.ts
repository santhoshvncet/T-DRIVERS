    import { Request, Response } from "express";
    import { HTTP_RESPONSES, HTTP_RESPONSE_KEY } from "./httpStatusCodes";

    export const sendResponse = (
      res: Response,
      key: HTTP_RESPONSE_KEY,
      options?: {
        response?: any; // legacy full response
        data?: any;
        message?: string;
        field?: string;
        error?: any;
        req?: Request;
        raw?: { statusCode: number; body: any; type?: "json" | "send" };
        [key: string]: any;
      }
    ) => {
      // ---------------- RAW PASSTHROUGH ----------------
      if (options?.raw) {
        const { statusCode, body, type } = options.raw;
        return type === "send" ? res.status(statusCode).send(body) : res.status(statusCode).json(body);
      }

      let responseObj: { statusCode: number; message: string };

      // ---------------- RESOLVE RESPONSE OBJECT ----------------
      if (key === "MISSING_FIELD" && options?.field) {
        responseObj = HTTP_RESPONSES.MISSING_FIELD(options.field);
      } else if (key === "OK" && options?.req) {
        // pick method-specific message
        const method = options.req.method.toUpperCase() as keyof typeof HTTP_RESPONSES.OK;
        responseObj = HTTP_RESPONSES.OK[method] || HTTP_RESPONSES.FETCH_OK;
      } else {
        responseObj = HTTP_RESPONSES[key] as { statusCode: number; message: string };
      }

      const isSuccess = responseObj.statusCode >= 200 && responseObj.statusCode < 300;

      const payload: any = { status: isSuccess, statusCode: responseObj.statusCode };

      // ---------------- SUCCESS RESPONSE ----------------
    if (isSuccess) {
      if (options) {
        const { req, error, response, raw, message, ...rest } = options;
        Object.assign(payload, rest); // attach other fields
        if (message) payload.message = message; // attach custom message
      }
      if (!payload.message) payload.message = responseObj.message; // default message
    } else {
        // ---------------- ERROR RESPONSE ----------------
        const isErrorEmpty =
          options?.error === undefined ||
          options?.error === null ||
          (typeof options.error === "object" && Object.keys(options.error).length === 0);
        payload.error = isErrorEmpty ? responseObj.message : options.error;
      }

      return res.status(responseObj.statusCode).json(payload);
    };

    export const errorPayload = (error: any) => (error instanceof Error ? error.message : error);