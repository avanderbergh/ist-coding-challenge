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
  protected readonly maxRetries = 5;
  protected readonly baseDelay = 1000;

  protected abstract doValidate(
    countryCode: string,
    vat: string
  ): Promise<boolean>;

  async fetchWithTimeout(
    input: string | URL | Request,
    init?: RequestInit,
    timeout = 5000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async validate(countryCode: string, vat: string): Promise<boolean> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      console.log(`Attempt ${attempt + 1} for ${countryCode} ${vat}`);
      if (attempt > 0) {
        const delay =
          this.baseDelay * 2 ** (attempt - 1) + Math.random() * this.baseDelay;
        await new Promise((res) => setTimeout(res, delay));
      }

      try {
        return await this.doValidate(countryCode, vat);
      } catch (error: unknown) {
        const isValidationError = error instanceof VatValidationError;
        const responseStatus = isValidationError
          ? error.responseStatus
          : undefined;
        const retryAfterHeader = isValidationError
          ? error.retryAfterHeader
          : undefined;
        const shouldRetryStatus =
          responseStatus === 429 ||
          (typeof responseStatus === "number" &&
            responseStatus >= 500 &&
            responseStatus < 600);
        const hasRetryAfter = typeof retryAfterHeader === "string";
        const isNetworkError = error instanceof TypeError;
        const isRetryable = isValidationError && error.isRetryable;

        if (
          (shouldRetryStatus || isNetworkError || isRetryable) &&
          attempt < this.maxRetries
        ) {
          if (hasRetryAfter) {
            const retryAfter = Number.parseInt(retryAfterHeader as string, 10);
            if (!Number.isNaN(retryAfter)) {
              await new Promise((res) => setTimeout(res, retryAfter * 1000));
              continue;
            }
          }
          continue;
        }

        throw error;
      }
    }

    throw new Error(`Validation failed after ${this.maxRetries} attempts`);
  }
}
