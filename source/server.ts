import express, {
  json,
  type Express,
  type Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import helmet from "helmet";
import responseTime from "response-time";
import path from "node:path";
import VatValidationRouter from "./routers/VatValidationRouter";
import {
  UnifiedVatValidationService,
  type VatValidationService,
} from "./services/UnifiedVatValidationService";

export interface AppServices {
  euVatValidationService: VatValidationService;
  chVatValidationService: VatValidationService;
}

const GlobalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);
  const code = 500;
  res.status(code).json({
    code,
    message: err.message || "Internal Server Error",
  });
};

export default function createApp(services: AppServices): {
  app: Express;
  router: Router;
} {
  const app: Express = express();

  app.use(helmet());
  app.use(json());

  app.use(responseTime({ suffix: true }));

  app.get("/api-spec", (_req, res) => {
    res.sendFile(
      path.resolve(process.cwd(), "source", "static", "openapi.yaml")
    );
  });

  const vatValidationService = new UnifiedVatValidationService(
    services.euVatValidationService,
    services.chVatValidationService
  );

  const router = VatValidationRouter(vatValidationService);
  app.use("/", router);

  app.use(GlobalErrorHandler);
  return { app, router };
}
