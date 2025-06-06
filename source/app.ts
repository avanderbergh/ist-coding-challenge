import type { Server } from "node:http";
import {
  type ExpressServerConfiguration,
  readAppConfiguration,
} from "./models/ConfigurationModel.js";
import createApp from "./server.js";
import { CHVatValidator } from "./services/CHVatValidator.js";
import { EUVatValidator } from "./services/EUVatValidator.js";
import type { VatValidator } from "./services/VatValidationCoordinator.js";

const configuration: ExpressServerConfiguration = readAppConfiguration();

const validators: VatValidator[] = [new CHVatValidator(), new EUVatValidator()];

const server: Server = createApp(validators).app.listen(
  configuration.port,
  () => {
    console.log({ description: `STARTING ON PORT ${configuration.port}` });
  }
);

server.keepAliveTimeout = configuration.expressServerOptions.keepAliveTimeout;
server.maxHeadersCount = configuration.expressServerOptions.maxHeadersCount;
server.maxConnections = configuration.expressServerOptions.maxConnections;
server.headersTimeout = configuration.expressServerOptions.headersTimeout;
server.requestTimeout = configuration.expressServerOptions.requestTimeout;
server.timeout = configuration.expressServerOptions.timeout;
