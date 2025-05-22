import type { Server } from "node:http";

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
  readonly port: number;
  readonly expressServerOptions: ExpressServerOptions;
}

export const readAppConfiguration = (): ExpressServerConfiguration => {
  const port = Number(process.env.PORT ?? 3000);
  const expressServerOptions = {
    keepAliveTimeout: Number(process.env.KEEP_ALIVE_TIMEOUT ?? 0),
    headersTimeout: Number(process.env.HEADERS_TIMEOUT ?? 30000),
    timeout: Number(process.env.TIMEOUT ?? 60000),
    requestTimeout: Number(process.env.REQUEST_TIMEOUT ?? 30000),
    maxConnections: Number(process.env.MAX_CONNECTIONS ?? 1000),
    maxHeadersCount: Number(process.env.MAX_HEADERS_COUNT ?? 1000),
  } as ExpressServerOptions;
  return { port, expressServerOptions };
};
