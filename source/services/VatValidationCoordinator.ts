export interface VatValidator {
  readonly supportedCountries: string[];
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
  public readonly supportedCountries: string[];
  constructor(private readonly validators: VatValidator[]) {
    this.supportedCountries = validators.flatMap((v) => v.supportedCountries);
  }

  private getValidator(countryCode: string): VatValidator | undefined {
    return this.validators.find((v) =>
      v.supportedCountries.includes(countryCode)
    );
  }

  async validate(countryCode: string, vatNumber: string): Promise<boolean> {
    const validator = this.getValidator(countryCode);
    if (!validator) {
      throw new VatValidationError(
        `No VAT validator registered for ${countryCode}`,
        { isRetryable: false }
      );
    }
    return validator.validate(countryCode, vatNumber);
  }
}
