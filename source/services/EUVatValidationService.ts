import type { VatValidationService } from "./UnifiedVatValidationService";

export class EUVatValidationService implements VatValidationService {
  private readonly url =
    "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";

  async validate(countryCode: string, vat: string) {
    // TODO: Add exponential backoff retry logic
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        countryCode,
        vatNumber: vat.slice(2),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to validate VAT number");
    }
    const data = (await response.json()) as {
      countryCode: string;
      vatNumber: string;
      valid: boolean;
    };

    console.log({ data });

    return data.valid;
  }
}
