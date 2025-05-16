import {
  type NextFunction,
  Router,
  type Request,
  type Response,
} from "express";
import { z } from "zod";
import VatValidationController from "../controllers/VatValidationController";
import type { Configuration } from "../models/ConfigurationModel";
import { VatValidationSchema } from "../schemas/VatValidationSchema";

let vatValidationController: VatValidationController; // TO_CHANGE: naming

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!(err instanceof z.ZodError)) {
    return next(err);
  }
  for (const issue of err.issues) {
    if (issue.code === z.ZodIssueCode.custom) {
      if (issue.params?.statusCode) {
        return res.status(issue.params.statusCode).json({
          message: issue.message,
        });
      }
    }
  }
  return next(err);
};

const router = (configuration: Configuration): Router => {
  // TO_CHANGE: if you don't need your configuration here or in the controller, you can remove the function and just export the router itself
  const expressRouter: Router = Router({
    caseSensitive: true,
    strict: true,
  });
  vatValidationController = new VatValidationController(configuration); // You can make the controller a const if it doesn't need the configuration

  expressRouter.post("/", (req, res) => {
    const data = VatValidationSchema.parse(req.body);

    // const r = vatValidationController.validateVatNumber(true);
    res.status(200).json({ message: "ok" });
  });

  return expressRouter.use(errorHandler);
};
export default router;
