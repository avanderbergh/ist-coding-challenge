import type { Express } from "express";
import request from "supertest";
import createApp from "../../source/server";
import type { VatValidationService } from "../../source/services/UnifiedVatValidationService";

describe("Validation Middleware", () => {
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

  it("returns 400 error and message for invalid payload", async () => {
    const { body } = await request(app).post("/").send({}).expect(400);

    expect(body.code).toBe(400);
    expect(body.message).toBe("'countryCode' is required, 'vat' is required");

    expect(euVatValidationService.validate).not.toHaveBeenCalled();
    expect(chVatValidationService.validate).not.toHaveBeenCalled();
  });

  it("returns 501 error and message for unsupported country code", async () => {
    const { body } = await request(app)
      .post("/")
      .send({ countryCode: "XX", vat: "123456789" })
      .expect(501);

    expect(body.code).toBe(501);
    expect(body.message).toBe("Unsupported country code XX");

    expect(euVatValidationService.validate).not.toHaveBeenCalled();
    expect(chVatValidationService.validate).not.toHaveBeenCalled();
  });

  it("returns 400 error and message for invalid VAT number", async () => {
    const { body } = await request(app)
      .post("/")
      .send({ countryCode: "DE", vat: "123" })
      .expect(400);

    expect(body.code).toBe(400);
    expect(body.message).toBe("Invalid VAT number for country DE");

    expect(euVatValidationService.validate).not.toHaveBeenCalled();
    expect(chVatValidationService.validate).not.toHaveBeenCalled();
  });
});
