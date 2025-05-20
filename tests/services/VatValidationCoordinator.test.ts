import { CHVatValidator } from "../../source/services/CHVatValidator.js";
import { EUVatValidator } from "../../source/services/EUVatValidator.js";
import { VatValidationCoordinator } from "../../source/services/VatValidationCoordinator.js";

describe("Vat Validation Coordinator", () => {
  let fetchSpy: jest.SpyInstance;

  let vatValidationCoordinator: VatValidationCoordinator;

  beforeAll(() => {
    vatValidationCoordinator = new VatValidationCoordinator({
      ch: new CHVatValidator(),
      eu: new EUVatValidator(),
    });
  });

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("Correctly routes and called the EU VAT Validation API and returns true for a valid VAT Number", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ valid: true }),
      headers: {
        get: jest.fn(() => null),
      },
    });

    const result = await vatValidationCoordinator.validate("AT", "ATU63611700");

    expect(result).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: "AT", vatNumber: "U63611700" }),
      }
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("Correctly routes and calls the EU VAT Validation API and returns false for an invalid VAT Number", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ valid: false }),
      headers: {
        get: jest.fn(() => null),
      },
    });

    const result = await vatValidationCoordinator.validate("AT", "ATU63611700");

    expect(result).toBe(false);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: "AT", vatNumber: "U63611700" }),
      }
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("Retries on MS_MAX_CONCURRENT_REQ error from EU VAT API", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        actionSucceed: false,
        errorWrappers: [{ error: "MS_MAX_CONCURRENT_REQ" }],
      }),
      headers: {
        get: jest.fn(() => null),
      },
    });

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ valid: true }),
      headers: {
        get: jest.fn(() => null),
      },
    });

    const result = await vatValidationCoordinator.validate("AT", "ATU63611700");
    expect(result).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: "AT", vatNumber: "U63611700" }),
      }
    );
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("Correctly routes and calls the Swiss VAT Validation API and returns true for a valid VAT Number", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        "<soap:Envelope><soap:Body><ValidateVatNumberResponse><ValidateVatNumberResult>true</ValidateVatNumberResult></ValidateVatNumberResponse></soap:Body></soap:Envelope>",
      headers: {
        get: jest.fn(() => null),
      },
    });

    const validators = {
      ch: new CHVatValidator(),
      eu: new EUVatValidator(),
    };

    const vatValidationCoordinator = new VatValidationCoordinator(validators);

    const result = await vatValidationCoordinator.validate(
      "CH",
      "CHE-123.456.789"
    );

    expect(result).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://www.uid-wse.admin.ch/V5.0/PublicServices.svc",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction:
            "http://www.uid.admin.ch/xmlns/uid-wse/IPublicServices/ValidateVatNumber",
        },
        body: expect.stringContaining(
          "<uid:vatNumber>CHE-123.456.789</uid:vatNumber>"
        ),
      }
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("Correctly routes and calls the Swiss VAT Validation API and returns false for an invalid VAT Number", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        "<soap:Envelope><soap:Body><ValidateVatNumberResponse><ValidateVatNumberResult>false</ValidateVatNumberResult></ValidateVatNumberResponse></soap:Body></soap:Envelope>",
      headers: {
        get: jest.fn(() => null),
      },
    });

    const result = await vatValidationCoordinator.validate(
      "CH",
      "CHE-123.456.789"
    );

    expect(result).toBe(false);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://www.uid-wse.admin.ch/V5.0/PublicServices.svc",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction:
            "http://www.uid.admin.ch/xmlns/uid-wse/IPublicServices/ValidateVatNumber",
        },
        body: expect.stringContaining(
          "<uid:vatNumber>CHE-123.456.789</uid:vatNumber>"
        ),
      }
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("Throws a non-retryable client fault error for Swiss VAT API without retry", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
           <soap:Body>
             <soap:Fault>
               <faultcode>Client.InvalidVat</faultcode>
               <faultstring>Invalid VAT number</faultstring>
             </soap:Fault>
           </soap:Body>
         </soap:Envelope>`,
      headers: {
        get: jest.fn(() => null),
      },
    });

    await expect(
      vatValidationCoordinator.validate("CH", "CHE-123.456.789")
    ).rejects.toThrow(
      "SOAP Fault calling Swiss VAT Service: Client.InvalidVat - Invalid VAT number"
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://www.uid-wse.admin.ch/V5.0/PublicServices.svc",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction:
            "http://www.uid.admin.ch/xmlns/uid-wse/IPublicServices/ValidateVatNumber",
        },
        body: expect.stringContaining(
          "<uid:vatNumber>CHE-123.456.789</uid:vatNumber>"
        ),
      }
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
