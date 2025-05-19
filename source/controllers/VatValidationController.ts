import type { VatValidationType } from "../schemas/VatValidationSchema";
import type { VatValidationService } from "../services/UnifiedVatValidationService";
import type { Request, Response } from "express";

export default class VatValidationController {
  constructor(private readonly service: VatValidationService) {}

  async validateVatNumber(req: Request, res: Response) {
    const { countryCode, vat }: VatValidationType = req.body;
    const validated = await this.service.validate(countryCode, vat);

    res.status(200).json({
      validated,
      details: `VAT number is ${validated ? "valid" : "invalid"} for the given country code.`,
    });
  }
}
