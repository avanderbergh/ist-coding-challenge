import { VatValidationSchema } from "../../source/schemas/VatValidationSchema";
import { companyVatNumbers } from "../data/vat-numbers";

describe("Vat Validation Schema", () => {
  for (const { countryCode, vat } of companyVatNumbers) {
    it(`validates a VAT number for ${countryCode}`, () => {
      const result = VatValidationSchema.safeParse({
        countryCode,
        vat,
      });

      expect(result.success).toBe(true);
    });
  }

  it("returns a 501 error for an unsupported country code", () => {
    const result = VatValidationSchema.safeParse({
      countryCode: "XX",
      vat: "XX123456789",
    });

    expect(result.success).toBe(false);

    expect(result.error?.issues.length).toBe(1);

    const issue = result.error?.issues[0];
    if (!issue) {
      fail("Expected an issue to be present");
    }

    expect(issue.code === "custom" && issue.params?.statusCode).toBe(501);
    expect(issue.message).toBe("Unsupported country code");
  });

  it("returns a 400 error for an invalid VAT number", () => {
    const result = VatValidationSchema.safeParse({
      countryCode: "DE",
      vat: "DE1234567890", // Invalid VAT number for Germany
    });

    expect(result.success).toBe(false);

    expect(result.error?.issues.length).toBe(1);

    const issue = result.error?.issues[0];
    if (!issue) {
      fail("Expected an issue to be present");
    }

    expect(issue.code === "custom" && issue.params?.statusCode).toBe(400);
    expect(issue.message).toBe("Invalid VAT number for country DE");
  });

  it("returns a 400 error for an invalid VAT number with a different country code", () => {
    const result = VatValidationSchema.safeParse({
      countryCode: "FR",
      vat: "FR1234567890", // Invalid VAT number for France
    });

    expect(result.success).toBe(false);

    expect(result.error?.issues.length).toBe(1);

    const issue = result.error?.issues[0];
    if (!issue) {
      fail("Expected an issue to be present");
    }

    expect(issue.code === "custom" && issue.params?.statusCode).toBe(400);
    expect(issue.message).toBe("Invalid VAT number for country FR");
  });
});
