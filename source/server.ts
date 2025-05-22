import path from "node:path";
import express, {
  json,
  type ErrorRequestHandler,
  type Express,
  type Router,
} from "express";
import helmet from "helmet";
import responseTime from "response-time";
import VatValidationRouter from "./routers/VatValidationRouter.js";
import {
  VatValidationCoordinator,
  type VatValidator,
} from "./services/VatValidationCoordinator.js";

const GlobalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const code = 500;
  res.status(code).json({
    code,
    message: err.message || "Internal Server Error",
  });
};

export default function createApp(validators: VatValidator[]): {
  app: Express;
  router: Router;
} {
  const app: Express = express();

  app.use(helmet());
  app.use(json());

  app.use(responseTime({ suffix: true }));

  app.get("/api-spec", (_req, res) => {
    res.sendFile(path.resolve(process.cwd(), "docs", "openapi.yaml"));
  });

  const vatValidationService = new VatValidationCoordinator(validators);

  const router = VatValidationRouter(vatValidationService);
  app.use("/", router);

  app.use(GlobalErrorHandler);
  return { app, router };
}
