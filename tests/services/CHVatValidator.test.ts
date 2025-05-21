import { CHVatValidator } from "../../source/services/CHVatValidator.js";
import { VatValidationError } from "../../source/services/RetryableVatValidator.js";

describe("CHVatValidator", () => {
  let fetchSpy: jest.SpyInstance;
  let validator: CHVatValidator;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, "fetch");
    jest.useFakeTimers();
    validator = new CHVatValidator();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    jest.useRealTimers();
  });

  it("should return true for a valid CH VAT number", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        "<soap:Envelope><soap:Body><ValidateVatNumberResponse><ValidateVatNumberResult>true</ValidateVatNumberResult></ValidateVatNumberResponse></soap:Body></soap:Envelope>",
      headers: { get: jest.fn(() => null) },
    });

    const result = await validator.validate("CH", "CHE-123.456.789");

    expect(result).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://www.uid-wse.admin.ch/V5.0/PublicServices.svc",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining(
          "<uid:vatNumber>CHE-123.456.789</uid:vatNumber>"
        ),
        signal: expect.anything(),
      })
    );
  });

  it("should return false for an invalid CH VAT number", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        "<soap:Envelope><soap:Body><ValidateVatNumberResponse><ValidateVatNumberResult>false</ValidateVatNumberResult></ValidateVatNumberResponse></soap:Body></soap:Envelope>",
      headers: { get: jest.fn(() => null) },
    });

    const result = await validator.validate("CH", "CHE-123.456.789");

    expect(result).toBe(false);
  });

  it("should throw VatValidationError for non-CH country code", async () => {
    const promise = validator.validate("DE", "DE123456789");
    jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow(
      new VatValidationError("Invalid country code for Swiss VAT validation", {
        isRetryable: false,
      })
    );
  });

  it("should throw VatValidationError for HTTP 429 error", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "",
      headers: { get: jest.fn(() => null) },
    });

    const promise = validator.validate("CH", "123456");
    jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow(VatValidationError);
  });

  it("should throw VatValidationError for HTTP 5xx error", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "",
      headers: { get: jest.fn(() => null) },
    });

    const promise = validator.validate("CH", "123456");
    jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow(VatValidationError);
  });

  it("should throw VatValidationError for malformed XML response (no ValidateVatNumberResult)", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        "<soap:Envelope><soap:Body></soap:Body></soap:Envelope>",
      headers: { get: jest.fn(() => null) },
    });

    const promise = validator.validate("CH", "CHE-123.456.789");
    jest.runAllTimersAsync();
    await expect(promise).rejects.toThrow(
      new VatValidationError(
        "Invalid response from Swiss VAT validation service",
        {
          isRetryable: false,
        }
      )
    );
  });

  it("should throw VatValidationError for SOAP fault", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><soap:Fault><faultcode>Client.TestFault</faultcode><faultstring>Test fault message</faultstring></soap:Fault></soap:Body></soap:Envelope>',
      headers: { get: jest.fn(() => null) },
    });

    const promise = validator.validate("CH", "CHE-123.456.789");
    jest.runAllTimersAsync();
    await expect(promise).rejects.toThrow(
      new VatValidationError(
        "SOAP Fault calling Swiss VAT Service: Client.TestFault - Test fault message",
        {
          isRetryable: false,
        }
      )
    );
  });

  it("should identify server-side SOAP faults as retryable", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: jest.fn(() => null) },
      text: async () => `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <soap:Fault>
              <faultcode>soap:Server</faultcode>
              <faultstring>Internal server error</faultstring>
            </soap:Fault>
          </soap:Body>
        </soap:Envelope>`,
    });

    const promise = validator.validate("CH", "CHE-123.456.789");
    jest.runAllTimersAsync();
    await expect(promise).rejects.toThrow(
      new VatValidationError(
        "SOAP Fault calling Swiss VAT Service: soap:Server - Internal server error",
        {
          isRetryable: true,
        }
      )
    );
  });
});
