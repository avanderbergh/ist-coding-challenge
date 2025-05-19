import type { Server } from "node:http";
import fs from "node:fs";

type ExpressServerOptions = Pick<
  Server,
  | "keepAliveTimeout"
  | "maxHeadersCount"
  | "timeout"
  | "maxConnections"
  | "headersTimeout"
  | "requestTimeout"
>;

export interface ExpressServerConfiguration {
  // TO_CHANGE: add your needed configuration parameters
  readonly port: number;
  readonly expressServerOptions: ExpressServerOptions;
}

export const readAppConfiguration = (
  file: string
): ExpressServerConfiguration => {
  const configuration: ExpressServerConfiguration = JSON.parse(
    fs.readFileSync(file, "utf-8")
  );

  return configuration;
};
