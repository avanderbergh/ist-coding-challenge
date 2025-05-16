import { isValidCountryCode } from "../../source/services/CheckValidCountryCode";

describe("Check valid country codes", () => {
  it("passes a valid country code", () => {
    const result = isValidCountryCode("DE");
    expect(result).toBe(true);
  });

  it("fails an invalid country code", () => {
    const result = isValidCountryCode("XX");
    expect(result).toBe(false);
  });
});
