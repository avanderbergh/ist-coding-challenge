export interface VatValidator {
  validate(countryCode: string, vatNumber: string): Promise<boolean>;
}

export interface RegionValidators {
  ch: VatValidator;
  eu: VatValidator;
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
  constructor(private readonly validators: RegionValidators) {}

  private getValidator(countryCode: string): VatValidator {
    if (countryCode === "CH") {
      return this.validators.ch;
    }

    return this.validators.eu;
  }

  async validate(countryCode: string, vatNumber: string): Promise<boolean> {
    const validator = this.getValidator(countryCode);

    return validator.validate(countryCode, vatNumber);
  }
}
