import {
  RetryableVatValidator,
  VatValidationError,
} from "./RetryableVatValidator.js";

export class CHVatValidator extends RetryableVatValidator {
  public readonly supportedCountries = ["CH"];
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

  protected async doValidate(
    countryCode: string,
    vat: string
  ): Promise<boolean> {
    if (countryCode !== "CH") {
      throw new VatValidationError(
        "Invalid country code for Swiss VAT validation",
        { isRetryable: false }
      );
    }

    const response = await this.fetchWithTimeout(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction:
          "http://www.uid.admin.ch/xmlns/uid-wse/IPublicServices/ValidateVatNumber",
      },
      body: this.generateSoapEnvelope(vat),
    });
    const retryAfterHeader = response.headers.get("Retry-After");
    const text = await response.text();

    // HTTP-level retryable errors
    if (
      response.status === 429 ||
      (response.status >= 500 && response.status < 600)
    ) {
      throw new VatValidationError(
        `HTTP error calling Swiss VAT Service: ${response.status}`,
        { responseStatus: response.status, retryAfterHeader, isRetryable: true }
      );
    }

    // SOAP Fault detection
    const faultMatch = text.match(
      /<(?:\w+:)?Fault[^>]*>[\s\S]*?<faultcode[^>]*>([\s\S]*?)<\/(?:\w+:)?faultcode>[\s\S]*?<faultstring[^>]*>([\s\S]*?)<\/(?:\w+:)?faultstring>/i
    );
    if (faultMatch) {
      const faultCode = faultMatch[1].trim();
      const faultMessage = faultMatch[2].trim();
      // Treat any SOAP fault as retryable unless it's explicitly a client error
      const isClientFault = faultCode.includes("Client");
      throw new VatValidationError(
        `SOAP Fault calling Swiss VAT Service: ${faultCode} - ${faultMessage}`,
        { isRetryable: !isClientFault }
      );
    }

    // Parse result
    if (!text.includes("<ValidateVatNumberResult>")) {
      throw new VatValidationError(
        "Invalid response from Swiss VAT validation service",
        { isRetryable: false }
      );
    }
    const validMatch = text.match(
      /<ValidateVatNumberResult>(true|false)<\/ValidateVatNumberResult>/
    );
    const isValid = validMatch?.[1] === "true";
    return isValid;
  }
}
