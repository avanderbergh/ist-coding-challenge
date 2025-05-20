import { z } from "zod";
import {
  RetryableVatValidator,
  VatValidationError,
} from "./RetryableVatValidator.js";

const CommonErrorSchema = z.object({
  actionSucceed: z.literal(false),
  errorWrappers: z.array(
    z.object({ error: z.string(), message: z.string().optional() })
  ),
});

const SuccessResponseSchema = z.object({ valid: z.boolean() });

const VatApiResponseSchema = z.union([
  SuccessResponseSchema,
  CommonErrorSchema,
]);

export class EUVatValidator extends RetryableVatValidator {
  private readonly url =
    "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";

  protected async doValidate(
    countryCode: string,
    vat: string
  ): Promise<boolean> {
    // Add timeout check and throw an error if it exceeds 5 seconds
    const response = await this.fetchWithTimeout(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode, vatNumber: vat.slice(2) }),
    });
    const retryAfterHeader = response.headers.get("Retry-After");
    if (!response.ok) {
      throw new VatValidationError(
        `Error calling EU VAT API: HTTP ${response.status} ${response.statusText}`,
        { responseStatus: response.status, retryAfterHeader, isRetryable: true }
      );
    }

    const json = await response.json();
    const parseResult = VatApiResponseSchema.safeParse(json);
    if (!parseResult.success) {
      throw new VatValidationError("Invalid response schema from EU VAT API", {
        isRetryable: false,
      });
    }
    const parsed = parseResult.data;
    if ("valid" in parsed) {
      return parsed.valid;
    }
    const errCode = parsed.errorWrappers[0]?.error;
    if (errCode === "MS_UNAVAILABLE") {
      throw new VatValidationError(
        `EU VAT service unavailable for ${countryCode}`,
        { isRetryable: false }
      );
    }
    if (errCode === "MS_MAX_CONCURRENT_REQ") {
      throw new VatValidationError(`EU VAT API rate limit: ${errCode}`, {
        isRetryable: true,
      });
    }
    throw new VatValidationError(
      `EU VAT API error: ${errCode ?? "Unknown error"}`,
      { isRetryable: false }
    );
  }
}
