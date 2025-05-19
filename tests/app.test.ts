import type { Express } from "express";
import createApp from "../source/server";
import type { VatValidationService } from "../source/services/UnifiedVatValidationService";
import { configuration } from "./shared-data";

describe("Server Starts", () => {
  let app: Express;
  let euVatValidationService: jest.Mocked<VatValidationService>;
  let chVatValidationService: jest.Mocked<VatValidationService>;

  beforeEach(() => {
    euVatValidationService = { validate: jest.fn() };
    chVatValidationService = { validate: jest.fn() };

    app = createApp({
      euVatValidationService,
      chVatValidationService,
    }).app;
  });

  it("creates a server", async () => {
    const server = app.listen(configuration.port);

    expect(server).toBeDefined();

    server.close();
  });
});
