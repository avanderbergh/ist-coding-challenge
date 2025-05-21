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
    eu = { validate: jest.fn() };
    ch = { validate: jest.fn() };

    app = createApp({ eu, ch }).app;
  });

  it("creates a server", async () => {
    const server = app.listen(configuration.port);

    expect(server).toBeDefined();

    server.close();
  });

  it("serves the OpenAPI spec at /api-spec", async () => {
    const response = await request(app).get("/api-spec");
    expect(response.status).toBe(200);
    expect(response.type).toBe("text/yaml");
  });
});
