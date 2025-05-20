import type { Express } from "express";
import request from "supertest";
import createApp from "../../source/server.js";
import type { VatValidator } from "../../source/services/VatValidationCoordinator.js";

describe("Vat Validation Controller", () => {
  let app: Express;
  let eu: jest.Mocked<VatValidator>;
  let ch: jest.Mocked<VatValidator>;

  beforeEach(() => {
    eu = { validate: jest.fn() };
    ch = { validate: jest.fn() };

    app = createApp({ eu, ch }).app;
  });

  it("returns 200 and valid message for valid EU VAT number", async () => {
    const countryCode = "DE";
    const vat = "DE129274202";

    eu.validate.mockResolvedValueOnce(true);

    const { body } = await request(app)
      .post("/")
      .send({ countryCode, vat })
      .expect(200);

    expect(eu.validate).toHaveBeenCalledWith(countryCode, vat);
    expect(ch.validate).not.toHaveBeenCalled();

    expect(body.validated).toBe(true);
    expect(body.details).toBe(
      "VAT number is valid for the given country code."
    );
  });

  it("returns 200 and invalid message for an invalid EU VAT number", async () => {
    const countryCode = "DE";
    const vat = "DE129274202";
    eu.validate.mockResolvedValueOnce(false);

    const { body } = await request(app)
      .post("/")
      .send({ countryCode, vat })
      .expect(200);

    expect(eu.validate).toHaveBeenCalledWith(countryCode, vat);
    expect(ch.validate).not.toHaveBeenCalled();

    expect(body.validated).toBe(false);
    expect(body.details).toBe(
      "VAT number is invalid for the given country code."
    );
  });
});
