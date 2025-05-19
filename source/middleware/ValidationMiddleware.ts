import type { NextFunction, Request, Response } from "express";
import {
  vatRegexMap,
  VatValidationSchema,
} from "../schemas/VatValidationSchema";

export const ValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let code: number;
  const { success, data, error } = VatValidationSchema.safeParse(req.body);

  if (!success) {
    code = 400;
    return res.status(code).json({
      code,
      message: error.issues.map(({ message }) => message).join(", "),
    });
  }
  const pattern = vatRegexMap[data.countryCode];
  if (!pattern) {
    code = 501;
    return res.status(code).json({
      code,
      message: `Unsupported country code ${data.countryCode}`,
    });
  }
  if (!pattern.test(data.vat)) {
    code = 400;
    return res.status(code).json({
      code,
      message: `Invalid VAT number for country ${data.countryCode}`,
    });
  }
  req.body = data;
  return next();
};
