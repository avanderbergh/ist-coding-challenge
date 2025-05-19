import type { Express } from "express";
import request from "supertest";
import createApp from "../../source/server";
import type { VatValidationService } from "../../source/services/UnifiedVatValidationService";
import { configuration } from "../shared-data";

describe("Vat Validation Controller", () => {
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

  it("returns 200 and valid message for valid EU VAT number", async () => {
    const countryCode = "DE";
    const vat = "DE129274202";

    euVatValidationService.validate.mockResolvedValueOnce(true);

    const { body } = await request(app)
      .post("/")
      .send({ countryCode, vat })
      .expect(200);

    expect(euVatValidationService.validate).toHaveBeenCalledWith(
      countryCode,
      vat
    );
    expect(chVatValidationService.validate).not.toHaveBeenCalled();

    expect(body.validated).toBe(true);
    expect(body.details).toBe(
      "VAT number is valid for the given country code."
    );
  });

  it("returns 200 and invalid message for an invalid EU VAT number", async () => {
    const countryCode = "DE";
    const vat = "DE129274202";
    euVatValidationService.validate.mockResolvedValueOnce(false);

    const { body } = await request(app)
      .post("/")
      .send({ countryCode, vat })
      .expect(200);

    expect(euVatValidationService.validate).toHaveBeenCalledWith(
      countryCode,
      vat
    );
    expect(chVatValidationService.validate).not.toHaveBeenCalled();

    expect(body.validated).toBe(false);
    expect(body.details).toBe(
      "VAT number is invalid for the given country code."
    );
  });
});
