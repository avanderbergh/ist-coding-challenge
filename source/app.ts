import type { Server } from "node:http";
import {
  readAppConfiguration,
  type ExpressServerConfiguration,
} from "./models/ConfigurationModel";
import createApp from "./server";
import { EUVatValidationService } from "./services/EUVatValidationService";
import { SwissVatValidationService } from "./services/SwissVatValidationService";

const configurationFile = "config.json";

const configuration: ExpressServerConfiguration =
  readAppConfiguration(configurationFile);

const euVatValidationService = new EUVatValidationService();
const chVatValidationService = new SwissVatValidationService();

const server: Server = createApp({
  euVatValidationService,
  chVatValidationService,
}).app.listen(configuration.port, () => {
  console.log({ description: "START" });
});

server.keepAliveTimeout = configuration.expressServerOptions.keepAliveTimeout;
server.maxHeadersCount = configuration.expressServerOptions.maxHeadersCount;
server.maxConnections = configuration.expressServerOptions.maxConnections;
server.headersTimeout = configuration.expressServerOptions.headersTimeout;
server.requestTimeout = configuration.expressServerOptions.requestTimeout;
server.timeout = configuration.expressServerOptions.timeout;
