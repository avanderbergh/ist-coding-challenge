import { Server } from "http";
import {
  Configuration,
  readAppConfiguration,
} from "./models/ConfigurationModel.js";
import createApp from "./server.js";

const configurationFile = "";

const configuration: Configuration = readAppConfiguration(configurationFile);

const server: Server = createApp(configuration).app.listen(
  configuration.port,
  () => {
    console.log({ description: "START" });
  }
);

server.keepAliveTimeout = configuration.expressServerOptions.keepAliveTimeout;
server.maxHeadersCount = configuration.expressServerOptions.maxHeadersCount;
server.maxConnections = configuration.expressServerOptions.maxConnections;
server.headersTimeout = configuration.expressServerOptions.headersTimeout;
server.requestTimeout = configuration.expressServerOptions.requestTimeout;
server.timeout = configuration.expressServerOptions.timeout;
