import { Router } from "express";
import { z } from "zod";
import DummyController from "../controllers/DummyController.js"; // TO_CHANGE: naming
import { Configuration } from "../models/ConfigurationModel.js";

let dummyController: DummyController; // TO_CHANGE: naming

const router = (configuration: Configuration): Router => {
  // TO_CHANGE: if you don't need your configuration here or in the controller, you can remove the function and just export the router itself
  const expressRouter: Router = Router({
    caseSensitive: true,
    strict: true,
  });
  dummyController = new DummyController(configuration); // You can make the controller a const if it doesn't need the configuration
  return expressRouter;
};
export default router;
