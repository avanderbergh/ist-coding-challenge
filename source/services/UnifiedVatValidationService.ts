export interface VatValidationService {
  validate(countryCode: string, vatNumber: string): Promise<boolean>;
}

export class UnifiedVatValidationService implements VatValidationService {
  constructor(
    private readonly eu: VatValidationService,
    private readonly ch: VatValidationService
  ) {}

  async validate(countryCode: string, vatNumber: string): Promise<boolean> {
    if (countryCode === "CH") {
      return this.ch.validate(countryCode, vatNumber);
    }

    return this.eu.validate(countryCode, vatNumber);
  }
}
