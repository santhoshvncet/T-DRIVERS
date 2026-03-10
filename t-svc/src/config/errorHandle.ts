import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { get } from "lodash";



export const checkAllowedError = (
    type: "_adminApi" | "globalErrorHandler" | "graphqlApi",
    err: any
  ) => {
    console.error(`error in ${type}`, err);
  };

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err) {
    const message = get(err, "response.errors[0].message", null) || err?.message || err;
    const ext_code = get(err, "response.errors[0].extensions.code", "")
    const is_allowed_error = err?.is_allowed_error;
    const isFromTrigger = ext_code && ext_code == "data-exception"
    const allowToSentry = isFromTrigger ? false : !is_allowed_error

    if (allowToSentry) {
      checkAllowedError("globalErrorHandler", message);
    }

    console.log("fetchError: ", { err, ext_code })

    res.locals.status = err.status || 400;
    res
      .status(res.locals.status)
      .send({ message: message, extensions: err.extensions });
  } else {
    next();
  }
};


//common  Error handling 


export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace?.(this, this.constructor);
    
  }
}

