import type { RequestHandler } from "express";
import {
  VatValidationSchema,
  vatRegexMap,
} from "../schemas/VatValidationSchema.js";

export const ValidationMiddleware: RequestHandler = (req, res, next) => {
  let code: number;
  const { success, data, error } = VatValidationSchema.safeParse(req.body);

  if (!success) {
    code = 400;
    res.status(code).json({
      code,
      message: error.issues.map(({ message }) => message).join(", "),
    });
    return;
  }
  const pattern = vatRegexMap[data.countryCode];
  if (!pattern) {
    code = 501;
    res.status(code).json({
      code,
      message: `Unsupported country code ${data.countryCode}`,
    });
    return;
  }
  if (!pattern.test(data.vat)) {
    code = 400;
    res.status(code).json({
      code,
      message: `Invalid VAT number for country ${data.countryCode}`,
    });
    return;
  }
  req.body = data;
  next();
};
