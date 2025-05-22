import type { Express } from "express";
import request from "supertest";
import createApp from "../source/server.js";
import { CHVatValidator } from "../source/services/CHVatValidator.js";
import { EUVatValidator } from "../source/services/EUVatValidator.js";
import { companyVatNumbers } from "./data/vat-numbers.js";

describe.skip("Check real vat numbers for all countries", () => {
  let app: Express;

  beforeAll(() => {
    app = createApp({
      eu: new EUVatValidator(),
      ch: new CHVatValidator(),
    }).app;

    console.log("Server started");
  });

  // Run tests sequentially
  for (const { company, countryCode, vat } of companyVatNumbers) {
    it(`returns a valid response for ${company} (${countryCode}): ${vat}`, async () => {
      console.log(`Testing ${company} (${countryCode}): ${vat}`);
      const { body } = await request(app)
        .post("/")
        .send({ countryCode, vat })
        .expect(200);

      expect(body.validated).toBe(true);
      expect(body.details).toBe(
        "VAT number is valid for the given country code."
      );
    }, 60000);
  }

  afterEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Add any cleanup logic here if needed in the future
    await new Promise((resolve) => setTimeout(resolve, 0)); // Ensure any pending operations complete
  });
});
