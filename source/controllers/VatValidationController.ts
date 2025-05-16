import type { Configuration } from "../models/ConfigurationModel";
import type { VatValidationType } from "../schemas/VatValidationSchema";

export default class VatValidationController {
  configuration: Configuration;

  constructor(configuration: Configuration) {
    this.configuration = configuration;
  }

  async validateVatNumber(dummyValue: VatValidationType) {
    this.validateVatNumber.toString();
    return {};
  }
}
