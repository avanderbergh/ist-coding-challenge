import type { Express } from "express";
import request from "supertest";
import createApp from "../source/server.js";
import type { VatValidator } from "../source/services/VatValidationCoordinator.js";
import { configuration } from "./shared-data.js";

describe("Server Starts", () => {
  let app: Express;
  let eu: jest.Mocked<VatValidator>;
  let ch: jest.Mocked<VatValidator>;

  beforeEach(() => {
    eu = { validate: jest.fn(), supportedCountries: new Set<string>() };
    ch = { validate: jest.fn(), supportedCountries: new Set<string>() };
    app = createApp([eu, ch]).app;
  });

  it("creates a server", async () => {
    const server = app.listen(configuration.port);

    expect(server).toBeDefined();

    server.close();
  });

  it("serves the OpenAPI spec at /api/v1/api-spec", async () => {
    const response = await request(app).get("/api/v1/api-spec");
    expect(response.status).toBe(200);
    expect(response.type).toBe("text/yaml");
  });

  it("responds on /readyz", async () => {
    const response = await request(app).get("/readyz");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("responds on /healthz", async () => {
    const response = await request(app).get("/healthz");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(typeof response.body.uptime).toBe("number");
    expect(typeof response.body.timestamp).toBe("string");
  });
});
