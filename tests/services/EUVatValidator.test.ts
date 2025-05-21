import { EUVatValidator } from "../../source/services/EUVatValidator.js";
import { VatValidationError } from "../../source/services/RetryableVatValidator.js";

describe("EUVatValidator", () => {
  let fetchSpy: jest.SpyInstance;
  let validator: EUVatValidator;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, "fetch");
    jest.useFakeTimers();
    validator = new EUVatValidator();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    jest.useRealTimers();
  });

  it("should return true for a valid EU VAT number", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ valid: true }),
      headers: { get: jest.fn(() => null) },
    });

    const result = await validator.validate("AT", "ATU63611700");
    expect(result).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ countryCode: "AT", vatNumber: "U63611700" }),
        signal: expect.anything(),
      })
    );
  });

  it("should return false for an invalid EU VAT number", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ valid: false }),
      headers: { get: jest.fn(() => null) },
    });

    const result = await validator.validate("AT", "ATU63611700");
    expect(result).toBe(false);
  });

  it("should throw VatValidationError if response.ok is false", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({}),
      headers: { get: jest.fn(() => null) },
    });

    const promise = validator.validate("DE", "DE123456789");
    jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow(
      new VatValidationError(
        "Error calling EU VAT API: HTTP 500 Internal Server Error",
        {
          responseStatus: 500,
          retryAfterHeader: null,
          isRetryable: true,
        }
      )
    );
  });

  it("should throw VatValidationError for MS_UNAVAILABLE error", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        actionSucceed: false,
        errorWrappers: [{ error: "MS_UNAVAILABLE" }],
      }),
      headers: { get: jest.fn(() => null) },
    });

    await expect(validator.validate("PL", "PL1234567890")).rejects.toThrow(
      new VatValidationError("EU VAT service unavailable for PL", {
        isRetryable: false,
      })
    );
  });

  it("should throw VatValidationError for MS_MAX_CONCURRENT_REQ error (and be retryable)", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        actionSucceed: false,
        errorWrappers: [{ error: "MS_MAX_CONCURRENT_REQ" }],
      }),
      headers: { get: jest.fn(() => null) },
    });

    const promise = validator.validate("ES", "ESA12345678");
    jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow(
      new VatValidationError("EU VAT API rate limit: MS_MAX_CONCURRENT_REQ", {
        isRetryable: true,
      })
    );
  });

  it("should throw VatValidationError for unknown API error", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        actionSucceed: false,
        errorWrappers: [{ error: "SOME_OTHER_ERROR" }],
      }),
      headers: { get: jest.fn(() => null) },
    });

    await expect(validator.validate("IT", "IT12345678901")).rejects.toThrow(
      new VatValidationError("EU VAT API error: SOME_OTHER_ERROR", {
        isRetryable: false,
      })
    );
  });

  it("should throw VatValidationError for unknown API error when errorWrappers is empty", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        actionSucceed: false,
        errorWrappers: [],
      }),
      headers: { get: jest.fn(() => null) },
    });

    await expect(validator.validate("IT", "IT12345678901")).rejects.toThrow(
      new VatValidationError("EU VAT API error: Unknown error", {
        isRetryable: false,
      })
    );
  });

  it("should throw VatValidationError for invalid response schema", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ someUnexpectedProperty: "value" }),
      headers: { get: jest.fn(() => null) },
    });

    await expect(validator.validate("FR", "FRXX123456789")).rejects.toThrow(
      new VatValidationError("Invalid response schema from EU VAT API", {
        isRetryable: false,
      })
    );
  });
});
