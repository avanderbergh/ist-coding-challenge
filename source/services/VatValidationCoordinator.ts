export interface VatValidator {
  readonly supportedCountries: ReadonlySet<string>;
  validate(countryCode: string, vatNumber: string): Promise<boolean>;
}

export class VatValidationError extends Error {
  constructor(
    message: string,
    public readonly details: { isRetryable: boolean }
  ) {
    super(message);
  }
}

export class VatValidationCoordinator implements VatValidator {
  public readonly supportedCountries: ReadonlySet<string>;
  private countryCodeToValidator: Map<string, VatValidator> = new Map();

  constructor(validators: VatValidator[]) {
    const countrySet = new Set<string>();
    for (const v of validators) {
      for (const c of v.supportedCountries) {
        countrySet.add(c.toUpperCase());
      }
    }
    this.supportedCountries = countrySet;

    for (const validator of validators) {
      for (const countryCode of validator.supportedCountries) {
        const code = countryCode.toUpperCase();
        if (this.countryCodeToValidator.has(code)) {
          throw new Error(`Duplicate VAT validator for ${code}`);
        }
        this.countryCodeToValidator.set(code, validator);
      }
    }
  }

  async validate(countryCode: string, vatNumber: string): Promise<boolean> {
    const code = countryCode.toUpperCase();
    const validator = this.countryCodeToValidator.get(code);
    if (!validator) {
      throw new VatValidationError(`No VAT validator registered for ${code}`, {
        isRetryable: false,
      });
    }
    return validator.validate(code, vatNumber);
  }
}
