import { Router } from "express";
import VatValidationController from "../controllers/VatValidationController.js";
import { ValidationMiddleware } from "../middleware/ValidationMiddleware.js";
import type { VatValidator } from "../services/VatValidationCoordinator.js";

let vatValidationController: VatValidationController;

const router = (service: VatValidator): Router => {
  const expressRouter: Router = Router({
    caseSensitive: true,
    strict: true,
  });

  vatValidationController = new VatValidationController(service);

  expressRouter.use(ValidationMiddleware);

  expressRouter.post("/", (req, res) => {
    return vatValidationController.validateVatNumber(req, res);
  });

  return expressRouter;
};
export default router;
