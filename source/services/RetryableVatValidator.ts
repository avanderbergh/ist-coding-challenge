import type { VatValidator } from "./VatValidationCoordinator.js";

export class VatValidationError extends Error {
  responseStatus?: number;
  retryAfterHeader?: string | null;
  isRetryable?: boolean;

  constructor(
    message: string,
    options: {
      responseStatus?: number;
      retryAfterHeader?: string | null;
      isRetryable?: boolean;
    } = {}
  ) {
    super(message);
    Object.assign(this, options);
  }
}

export abstract class RetryableVatValidator implements VatValidator {
  abstract readonly supportedCountries: ReadonlySet<string>;
  protected readonly maxRetries = 5;
  protected readonly baseDelay = 1000;

  protected abstract doValidate(
    countryCode: string,
    vat: string
  ): Promise<boolean>;

  async fetchWithTimeout(
    input: string | URL | Request,
    init?: RequestInit,
    timeout = 10000
  ): Promise<Response> {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(
          new VatValidationError(`Request timed out after ${timeout} ms`, {
            isRetryable: true,
          })
        );
      }, timeout);
    });
    try {
      const response = await Promise.race([
        fetch(input, { ...init, signal: controller.signal }),
        timeoutPromise,
      ]);
      return response;
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    }
  }

  async validate(countryCode: string, vat: string): Promise<boolean> {
    if (!this.supportedCountries.has(countryCode)) {
      throw new VatValidationError(
        `Country code ${countryCode} is not supported`,
        { isRetryable: false }
      );
    }

    let attempt = 0;
    do {
      try {
        return await this.doValidate(countryCode, vat);
      } catch (error: unknown) {
        let shouldRetry = false;
        let calculatedDelay = this.baseDelay * 2 ** attempt * Math.random(); // Exponential backoff with full jitter

        if (error instanceof VatValidationError) {
          const {
            responseStatus,
            retryAfterHeader,
            isRetryable: isErrorMarkedRetryable,
          } = error;

          const shouldRetryBasedOnStatus =
            responseStatus === 429 ||
            (typeof responseStatus === "number" &&
              responseStatus >= 500 &&
              responseStatus < 600);

          if (shouldRetryBasedOnStatus || isErrorMarkedRetryable) {
            shouldRetry = true;
            if (typeof retryAfterHeader === "string") {
              const retryAfter = Number.parseInt(retryAfterHeader, 10);
              if (!Number.isNaN(retryAfter)) {
                calculatedDelay = retryAfter * 1000;
              }
            }
          }
        } else if (error instanceof TypeError) {
          shouldRetry = true;
        }

        if (attempt < this.maxRetries && shouldRetry) {
          await new Promise((res) => setTimeout(res, calculatedDelay));
        } else {
          throw error;
        }
      }
      attempt++;
    } while (attempt <= this.maxRetries);

    /* istanbul ignore next */
    throw new Error(
      "Internal Error: Unreachable code in RetryableVatValidator.validate was reached"
    );
  }
}
