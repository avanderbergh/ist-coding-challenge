import { Server } from "http";
import fs from "fs";

type ExpressServerOptions = Pick<
  Server,
  | "keepAliveTimeout"
  | "maxHeadersCount"
  | "timeout"
  | "maxConnections"
  | "headersTimeout"
  | "requestTimeout"
>;

export interface Configuration {
  // TO_CHANGE: add your needed configuration parameters
  readonly port: number;
  readonly expressServerOptions: ExpressServerOptions;
}

export const readAppConfiguration = (file: string): Configuration => {
  const configuration: Configuration = JSON.parse(
    fs.readFileSync(file, "utf-8")
  );

  return configuration;
};
