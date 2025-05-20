import type { Express } from "express";
import request from "supertest";
import createApp from "../../source/server.js";
import type { VatValidator } from "../../source/services/VatValidationCoordinator.js";

describe("Validation Middleware", () => {
  let app: Express;

  let eu: jest.Mocked<VatValidator>;
  let ch: jest.Mocked<VatValidator>;

  beforeEach(() => {
    eu = { validate: jest.fn() };
    ch = { validate: jest.fn() };

    app = createApp({ eu, ch }).app;
  });

  it("returns 400 error and message for invalid payload", async () => {
    const { body } = await request(app).post("/").send({}).expect(400);

    expect(body.code).toBe(400);
    expect(body.message).toBe("'countryCode' is required, 'vat' is required");

    expect(eu.validate).not.toHaveBeenCalled();
    expect(ch.validate).not.toHaveBeenCalled();
  });

  it("returns 501 error and message for unsupported country code", async () => {
    const { body } = await request(app)
      .post("/")
      .send({ countryCode: "XX", vat: "123456789" })
      .expect(501);

    expect(body.code).toBe(501);
    expect(body.message).toBe("Unsupported country code XX");

    expect(eu.validate).not.toHaveBeenCalled();
    expect(ch.validate).not.toHaveBeenCalled();
  });

  it("returns 400 error and message for invalid VAT number", async () => {
    const { body } = await request(app)
      .post("/")
      .send({ countryCode: "DE", vat: "123" })
      .expect(400);

    expect(body.code).toBe(400);
    expect(body.message).toBe("Invalid VAT number for country DE");

    expect(eu.validate).not.toHaveBeenCalled();
    expect(ch.validate).not.toHaveBeenCalled();
  });
});
