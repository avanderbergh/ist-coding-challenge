export const configuration = {
  port: 3001,
  expressServerOptions: {
    keepAliveTimeout: 5000,
    maxHeadersCount: 100,
    maxConnections: 100,
    headersTimeout: 5000,
    requestTimeout: 5000,
    timeout: 5000,
  },
};
