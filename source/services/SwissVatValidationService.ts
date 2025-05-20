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

    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction:
          "http://www.uid.admin.ch/xmlns/uid-wse/IPublicServices/ValidateVatNumber",
      },
      body: this.generateSoapEnvelope(vat),
    });

    const text = await response.text();

    const faultMatch = text.match(
      /<(?:\w+:)?Fault[^>]*>[\s\S]*?<(?:\w+:)?faultstring[^>]*>([\s\S]*?)<\/(?:\w+:)?faultstring>/i
    );

    if (faultMatch) {
      const faultMessage = faultMatch[1].trim();

      const detailMatch = text.match(
        /<(?:\w+:)?errorDetail[^>]*>([\s\S]*?)<\/(?:\w+:)?errorDetail>/i
      );
      const detailMessage = detailMatch ? detailMatch[1].trim() : null;

      const fullMessage = detailMessage
        ? `Error while calling the Swiss VAT Validation Service: ${faultMessage} - ${detailMessage}`
        : `Error while calling the Swiss VAT Validation Service: ${faultMessage}`;

      throw new Error(fullMessage);
    }

    if (!response.ok) {
      throw new Error(
        `Error while calling the Swiss VAT Validation Service: HTTP ${response.status}`
      );
    }

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
