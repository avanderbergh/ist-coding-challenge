export interface VatValidator {
  validate(countryCode: string, vatNumber: string): Promise<boolean>;
}

export interface RegionValidators {
  ch: VatValidator;
  eu: VatValidator;
}

export class VatValidationCoordinator implements VatValidator {
  constructor(private readonly validators: RegionValidators) {}

  async validate(countryCode: string, vatNumber: string): Promise<boolean> {
    if (countryCode === "CH") {
      return this.validators.ch.validate(countryCode, vatNumber);
    }

    return this.validators.eu.validate(countryCode, vatNumber);
  }
}
