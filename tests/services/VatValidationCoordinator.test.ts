import type { CHVatValidator } from "../../source/services/CHVatValidator.js";
import type { EUVatValidator } from "../../source/services/EUVatValidator.js";
import {
  VatValidationCoordinator,
  VatValidationError,
} from "../../source/services/VatValidationCoordinator.js";

describe("Vat Validation Coordinator", () => {
  let eu: jest.Mocked<EUVatValidator>;
  let ch: jest.Mocked<CHVatValidator>;
  let vatValidationCoordinator: VatValidationCoordinator;

  beforeEach(() => {
    eu = {
      validate: jest.fn(),
      supportedCountries: ["FR", "DE", "AT"],
    } as unknown as jest.Mocked<EUVatValidator>;

    ch = {
      validate: jest.fn(),
      supportedCountries: ["CH"],
    } as unknown as jest.Mocked<CHVatValidator>;

    vatValidationCoordinator = new VatValidationCoordinator([eu, ch]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should route to EUVatValidator for an EU country code (e.g., AT) and return its result", async () => {
    eu.validate.mockResolvedValue(true);
    const result = await vatValidationCoordinator.validate("AT", "ATU12345678");
    expect(result).toBe(true);
    expect(eu.validate).toHaveBeenCalledWith("AT", "ATU12345678");
    expect(ch.validate).not.toHaveBeenCalled();
  });

  it("should route to EUVatValidator for another EU country code (e.g., DE) and return its result", async () => {
    eu.validate.mockResolvedValue(false);
    const result = await vatValidationCoordinator.validate("DE", "DE123456789");
    expect(result).toBe(false);
    expect(eu.validate).toHaveBeenCalledWith("DE", "DE123456789");
    expect(ch.validate).not.toHaveBeenCalled();
  });

  it("should route to CHVatValidator for CH country code and return its result", async () => {
    ch.validate.mockResolvedValue(true);
    const result = await vatValidationCoordinator.validate(
      "CH",
      "CHE123456789"
    );
    expect(result).toBe(true);
    expect(ch.validate).toHaveBeenCalledWith("CH", "CHE123456789");
    expect(eu.validate).not.toHaveBeenCalled();
  });

  it("should propagate errors from the EUVatValidator", async () => {
    const euError = new VatValidationError("EU Validator Error", {
      isRetryable: false,
    });
    eu.validate.mockRejectedValue(euError);
    await expect(
      vatValidationCoordinator.validate("FR", "FR123456789")
    ).rejects.toThrow(euError);
    expect(eu.validate).toHaveBeenCalledWith("FR", "FR123456789");
  });

  it("should propagate errors from the CHVatValidator", async () => {
    const chError = new VatValidationError("CH Validator Error", {
      isRetryable: true,
    });
    ch.validate.mockRejectedValue(chError);
    await expect(
      vatValidationCoordinator.validate("CH", "CHE123")
    ).rejects.toThrow(chError);
    expect(ch.validate).toHaveBeenCalledWith("CH", "CHE123");
  });

  it("should throw VatValidationError for unsupported country code", async () => {
    await expect(
      vatValidationCoordinator.validate("XX", "XX123")
    ).rejects.toThrow(
      new VatValidationError("No VAT validator registered for XX", {
        isRetryable: false,
      })
    );
  });
});
