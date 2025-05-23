import {
  RetryableVatValidator,
  VatValidationError,
} from "../../source/services/RetryableVatValidator.js";

class TestableValidator extends RetryableVatValidator {
  public readonly supportedCountries: ReadonlySet<string>;
  public mockDoValidate: jest.Mock<Promise<boolean>, [string, string]> =
    jest.fn();
  public callCount = 0;

  constructor(supportedCountries: ReadonlySet<string> = new Set()) {
    super();
    this.supportedCountries = supportedCountries;
  }

  protected async doValidate(
    countryCode: string,
    vat: string
  ): Promise<boolean> {
    this.callCount++;
    return this.mockDoValidate(countryCode, vat);
  }

  // Expose for testing
  public getBaseDelay() {
    return this.baseDelay;
  }
  public getMaxRetries() {
    return this.maxRetries;
  }
}

describe("RetryableVatValidator", () => {
  let validator: TestableValidator;

  beforeEach(() => {
    jest.useFakeTimers(); // Switch to modern fake timers
    validator = new TestableValidator(new Set(["ANY", "DE"]));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("should return true on first successful attempt", async () => {
    validator.mockDoValidate.mockResolvedValue(true);
    const result = await validator.validate("ANY", "ANY123");
    expect(result).toBe(true);
    expect(validator.mockDoValidate).toHaveBeenCalledTimes(1);
  });

  it("should retry on VatValidationError with isRetryable: true", async () => {
    validator.mockDoValidate
      .mockImplementationOnce(() => {
        return Promise.reject(
          new VatValidationError("Retryable error", { isRetryable: true })
        );
      })
      .mockImplementationOnce(() => {
        return Promise.resolve(true);
      });

    const promise = validator.validate("DE", "DE123456789");
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(true);
    expect(validator.mockDoValidate).toHaveBeenCalledTimes(2);
  });

  it("should retry on VatValidationError with HTTP 429 status", async () => {
    validator.mockDoValidate
      .mockRejectedValueOnce(
        new VatValidationError("Rate limit", { responseStatus: 429 })
      )
      .mockResolvedValueOnce(true);

    const promise = validator.validate("ANY", "ANY123");
    jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(true);
    expect(validator.mockDoValidate).toHaveBeenCalledTimes(2);
  });

  it("should retry on VatValidationError with HTTP 5xx status", async () => {
    validator.mockDoValidate
      .mockRejectedValueOnce(
        new VatValidationError("Server error", { responseStatus: 503 })
      )
      .mockResolvedValueOnce(true);

    const promise = validator.validate("ANY", "ANY123");
    jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(true);
    expect(validator.mockDoValidate).toHaveBeenCalledTimes(2);
  });

  it("should retry on TypeError (network error)", async () => {
    validator.mockDoValidate
      .mockRejectedValueOnce(new TypeError("Network failed"))
      .mockResolvedValueOnce(true);

    const promise = validator.validate("ANY", "ANY123");
    jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(true);
    expect(validator.mockDoValidate).toHaveBeenCalledTimes(2);
  });

  it("should use Retry-After header for delay if present", async () => {
    const retryAfterSeconds = 3;
    validator.mockDoValidate
      .mockRejectedValueOnce(
        new VatValidationError("Retryable with header", {
          isRetryable: true,
          retryAfterHeader: retryAfterSeconds.toString(),
        })
      )
      .mockResolvedValueOnce(true);

    const promise = validator.validate("ANY", "ANY123");
    jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(true);
    expect(validator.mockDoValidate).toHaveBeenCalledTimes(2);
  });

  it("should ignore invalid Retry-After header and use default backoff", async () => {
    validator.mockDoValidate
      .mockRejectedValueOnce(
        new VatValidationError("Retryable with invalid header", {
          isRetryable: true,
          retryAfterHeader: "not-a-number",
        })
      )
      .mockResolvedValueOnce(true);

    const promise = validator.validate("ANY", "ANY123");
    jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(true);
    expect(validator.mockDoValidate).toHaveBeenCalledTimes(2);
  });

  it("should throw immediately for non-retryable VatValidationError", async () => {
    const nonRetryableError = new VatValidationError("Non-retryable error", {
      isRetryable: false,
    });
    validator.mockDoValidate.mockRejectedValueOnce(nonRetryableError);

    await expect(validator.validate("ANY", "ANY123")).rejects.toThrow(
      nonRetryableError
    );
    expect(validator.mockDoValidate).toHaveBeenCalledTimes(1);
  });

  it("should throw immediately for VatValidationError with default options", async () => {
    const errorWithDefaultOptions = new VatValidationError(
      "Error with default options"
    );
    validator.mockDoValidate.mockRejectedValueOnce(errorWithDefaultOptions);

    await expect(validator.validate("ANY", "ANY123")).rejects.toThrow(
      errorWithDefaultOptions
    );
    expect(validator.mockDoValidate).toHaveBeenCalledTimes(1);
  });

  it("should throw immediately for generic Error", async () => {
    const genericError = new Error("Some other error");
    validator.mockDoValidate.mockRejectedValueOnce(genericError);

    await expect(validator.validate("ANY", "ANY123")).rejects.toThrow(
      genericError
    );
    expect(validator.mockDoValidate).toHaveBeenCalledTimes(1);
  });

  it("should throw VatValidationError if country code is not in supportedCountries (length > 2)", async () => {
    const localValidator = new TestableValidator(new Set(["DE", "FR"]));
    await expect(localValidator.validate("XXX", "XXX123")).rejects.toThrow(
      new VatValidationError("Country code XXX is not supported", {
        isRetryable: false,
      })
    );
    expect(localValidator.mockDoValidate).not.toHaveBeenCalled();
  });

  it("should throw VatValidationError if country code is not in supportedCountries (length == 2)", async () => {
    const localValidator = new TestableValidator(new Set(["DE", "FR"]));
    await expect(localValidator.validate("XX", "XX123")).rejects.toThrow(
      new VatValidationError("Country code XX is not supported", {
        isRetryable: false,
      })
    );
    expect(localValidator.mockDoValidate).not.toHaveBeenCalled();
  });

  it("fetchWithTimeout should abort after timeout", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    fetchSpy.mockImplementation(() => {
      return new Promise((resolve) =>
        setTimeout(
          () => resolve({ ok: true, text: async () => "response" } as Response),
          10000
        )
      );
    });
    const shortTimeout = 100;
    const validatorInstance = new TestableValidator();

    const promise = validatorInstance.fetchWithTimeout(
      "http://example.com",
      {},
      shortTimeout
    );
    jest.advanceTimersByTimeAsync(shortTimeout + 10);

    await expect(promise).rejects.toThrow(
      expect.objectContaining({
        name: "Error",
        message: `Request timed out after ${shortTimeout} ms`,
      })
    );
    fetchSpy.mockRestore();
  });

  it("fetchWithTimeout should clear timeout on successful fetch", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    const mockResponse = { ok: true, text: async () => "response" } as Response;
    fetchSpy.mockResolvedValue(mockResponse);
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

    const validatorInstance = new TestableValidator();
    const response = await validatorInstance.fetchWithTimeout(
      "http://example.com",
      {},
      5000
    );

    expect(response).toBe(mockResponse);
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it("should throw the final error if all retries fail", async () => {
    const maxRetries = validator.getMaxRetries();
    const finalError = new Error("Persistent failure");

    for (let i = 0; i <= maxRetries; i++) {
      if (i < maxRetries) {
        validator.mockDoValidate.mockRejectedValueOnce(
          new VatValidationError("Retryable error", { isRetryable: true })
        );
      } else {
        validator.mockDoValidate.mockRejectedValueOnce(finalError);
      }
    }

    const promise = validator.validate("ANY", "ANY123");

    jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow(finalError);
    expect(validator.callCount).toBe(maxRetries + 1);
  });
});
