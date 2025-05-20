import type { VatValidationService } from "./UnifiedVatValidationService";
import { z } from "zod";

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
    const baseDelay = 200;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delayMs = baseDelay * 2 ** (attempt - 1);
        await new Promise((res) => setTimeout(res, delayMs));
      }

      const response = await fetch(this.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode, vatNumber: vat.slice(2) }),
      });
      if (!response.ok) {
        console.error(
          `Failed to validate VAT number: ${response.status} ${response.statusText}`
        );
        throw new Error("Failed to validate VAT number");
      }
      const json = await response.json();
      const parseResult = VatApiResponseSchema.safeParse(json);
      if (!parseResult.success) {
        console.error("Invalid VIES API response", parseResult.error);
        throw new Error("Failed to validate VAT number");
      }
      const parsed = parseResult.data;
      if ("valid" in parsed) {
        return parsed.valid;
      }

      const errCode = parsed.errorWrappers[0]?.error;
      console.error("VIES API error", parsed.errorWrappers);

      if (errCode === "MS_MAX_CONCURRENT_REQ" && attempt < maxRetries) {
        continue;
      }

      throw new Error(errCode ?? "VAT API error");
    }

    throw new Error("VAT validation failed after retries");
  }
}
