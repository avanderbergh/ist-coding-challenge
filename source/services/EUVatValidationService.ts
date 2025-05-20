import { z } from "zod";
import type { VatValidationService } from "./UnifiedVatValidationService";

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

export class EUVatValidationService implements VatValidationService {
  private readonly url =
    "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";

  async validate(countryCode: string, vat: string) {
    const maxRetries = 5;
    const baseDelay = 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delayMs =
          baseDelay * 2 ** (attempt - 1) + Math.random() * baseDelay;
        await new Promise((res) => setTimeout(res, delayMs));
      }

      const response = await fetch(this.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode, vatNumber: vat.slice(2) }),
      });

      if (!response.ok) {
        console.error(
          `Error while calling External EU VAT API: HTTP ${response.status} ${response.statusText}`
        );
        throw new Error(
          "Error while calling External EU VAT API: HTTP request failed"
        );
      }

      const json = await response.json();
      const parseResult = VatApiResponseSchema.safeParse(json);

      if (!parseResult.success) {
        throw new Error(
          "Error while calling External EU VAT API: Invalid response schema"
        );
      }

      const parsed = parseResult.data;
      if ("valid" in parsed) {
        return parsed.valid;
      }

      const errCode = parsed.errorWrappers[0]?.error;

      if (errCode === "MS_UNAVAILABLE") {
        throw new Error(
          `VAT validation for ${countryCode} is currently unavailable`
        );
      }

      if (errCode === "MS_MAX_CONCURRENT_REQ" && attempt < maxRetries) {
        continue;
      }

      throw new Error(
        `Error while calling External EU VAT API: ${errCode ?? "Unknown error"}`
      );
    }

    throw new Error(
      `Error while calling External EU VAT API: validation failed after ${maxRetries} attempts`
    );
  }
}
