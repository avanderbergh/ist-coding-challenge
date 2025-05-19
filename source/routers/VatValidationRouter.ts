import { Router } from "express";
import VatValidationController from "../controllers/VatValidationController";
import { ValidationMiddleware } from "../middleware/ValidationMiddleware";
import type { VatValidationService } from "../services/UnifiedVatValidationService";

let vatValidationController: VatValidationController;

const router = (service: VatValidationService): Router => {
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
