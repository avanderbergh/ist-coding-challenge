import type { VatValidationService } from "./UnifiedVatValidationService";

export class SwissVatValidationService implements VatValidationService {
  private readonly url = "https://www.uid-wse.admin.ch/V5.0/PublicServices.svc";

  private generateSoapEnvelope(uid: string) {
    return `
    <?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                xmlns:uid="http://www.uid.admin.ch/xmlns/uid-wse">
    <soap:Body>
        <uid:ValidateVatNumber>
            <uid:vatNumber>${uid}</uid:vatNumber>
        </uid:ValidateVatNumber>
    </soap:Body>
    </soap:Envelope>
    `
      .replaceAll(/>\s*</g, "><")
      .replace(/\s{2,}/g, " ")
      .replaceAll("\n", "")
      .trim();
  }

  async validate(countryCode: string, vat: string) {
    if (countryCode !== "CH") {
      throw new Error("Invalid country code for Swiss VAT validation");
    }

    const body = this.generateSoapEnvelope(vat);

    console.log("SOAP Envelope:", body);

    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction:
          "http://www.uid.admin.ch/xmlns/uid-wse/IPublicServices/ValidateVatNumber",
      },
      body: this.generateSoapEnvelope(vat),
    });

    if (!response.ok) {
      throw new Error("Failed to validate VAT number");
    }
    const text = await response.text();

    const result = text.match(
      /<ValidateVatNumberResult>(true|false)<\/ValidateVatNumberResult>/
    );

    if (!result) {
      throw new Error("Invalid response from Swiss VAT validation service");
    }
    const isValid = result[1] === "true";

    return isValid;
  }
}
