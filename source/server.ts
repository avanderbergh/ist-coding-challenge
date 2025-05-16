import express, { Express, Router, json } from "express";
import responseTime from "response-time";
import Helmet from "helmet";
import DummyRouter from "./routers/DummyRouter.js"; // TO_CHANGE: naming
import { Configuration } from "./models/ConfigurationModel.js";

export default function createApp(configuration: Configuration): {
  app: Express;
  router: Router;
} {
  const app: Express = express();

  app.use(Helmet());
  app.use(json());

  app.use(responseTime({ suffix: true }));

  const router = DummyRouter(configuration);
  app.use("/", router);
  return { app, router };
}
